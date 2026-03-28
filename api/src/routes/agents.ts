import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../server.js';

export const agentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req, reply) => {
    const where = req.orgId ? { orgId: req.orgId } : {};
    const agents = await prisma.agent.findMany({ 
      where, 
      orderBy: { createdAt: 'desc' } 
    });
    return reply.send(agents.map(sanitizeAgent));
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const agent = await prisma.agent.findUnique({ where: { agentId: id } });
    if (!agent) return reply.code(404).send({ error: 'Agent not found' });
    return reply.send(sanitizeAgent(agent));
  });

  app.post('/', async (req, reply) => {
    const body = req.body as {
      agentId: string;
      name: string;
      walletAddr: string;
      privateKey?: string;
      policyId: string;
      orgId: string;
      chainId?: number;
      tokenAddr?: string;
      gateAddr?: string;
    };

    const existing = await prisma.agent.findUnique({ where: { agentId: body.agentId } });
    if (existing) return reply.code(409).send({ error: 'Agent already exists', agent: sanitizeAgent(existing) });

    const agent = await prisma.agent.create({ data: body });
    return reply.code(201).send({
      ...sanitizeAgent(agent),
      hasPrivateKey: !!agent.privateKey,
    });
  });

  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<{
      name: string;
      walletAddr: string;
      privateKey: string;
      policyId: string;
      chainId: number;
      tokenAddr: string;
      gateAddr: string;
      active: boolean;
    }>;

    const agent = await prisma.agent.update({
      where: { agentId: id },
      data: body,
    });
    return reply.send(sanitizeAgent(agent));
  });

  app.get('/:id/intents', async (req, reply) => {
    const { id } = req.params as { id: string };
    const query = req.query as { status?: string; limit?: string };

    const where: any = { agentId: id };
    if (query.status) where.status = query.status;

    const intents = await prisma.intent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit) || 50,
      include: { decisions: true },
    });
    return reply.send(intents);
  });

  app.get('/:id/stats', async (req, reply) => {
    const { id } = req.params as { id: string };

    const [total, approved, denied, needsApproval] = await Promise.all([
      prisma.intent.count({ where: { agentId: id } }),
      prisma.intent.count({ where: { agentId: id, status: 'APPROVED' } }),
      prisma.intent.count({ where: { agentId: id, status: 'DENIED' } }),
      prisma.intent.count({ where: { agentId: id, status: 'NEEDS_APPROVAL' } }),
    ]);

    const intents = await prisma.intent.findMany({
      where: { agentId: id },
      select: { payload: true },
    });
    let totalVolume = BigInt(0);
    for (const intent of intents) {
      try {
        const parsed = JSON.parse(intent.payload);
        totalVolume += BigInt(parsed.amount || '0');
      } catch { /* skip */ }
    }

    return reply.send({
      total,
      approved,
      denied,
      needsApproval,
      totalVolume: totalVolume.toString(),
    });
  });

  app.post('/:id/run', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      amount: string;
      to: string;
      asset?: string;
      purposeCode?: string;
    };

    const agent = await prisma.agent.findUnique({ where: { agentId: id } });
    if (!agent) return reply.code(404).send({ error: 'Agent not found' });
    if (!agent.active) return reply.code(403).send({ error: 'Agent is paused' });
    if (!agent.privateKey) return reply.code(400).send({ error: 'Agent has no private key — cannot execute autonomously' });
    if (!agent.gateAddr) return reply.code(400).send({ error: 'Agent has no gateAddr configured' });
    if (!agent.tokenAddr) return reply.code(400).send({ error: 'Agent has no tokenAddr configured' });

    const { createPublicClient, createWalletClient, http, parseAbi, defineChain } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');

    const chainId = agent.chainId || 99999;
    const chain = defineChain({
      id: chainId,
      name: 'Rayls Privacy Node',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [process.env.PRIVACY_NODE_RPC_URL || 'http://localhost:8545'] } },
    });

    const rpc = process.env.PRIVACY_NODE_RPC_URL || 'http://localhost:8545';
    const account = privateKeyToAccount(agent.privateKey as `0x${string}`);

    const nonce = ('0x' + Array.from(
      { length: 64 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join('')) as `0x${string}`;
    const expiry = Math.floor(Date.now() / 1000) + 3600;

    const intentData = {
      requestId: `auto_${Date.now()}`,
      orgId: agent.orgId,
      agentId: agent.agentId,
      actionType: 'TRANSFER' as const,
      asset: body.asset || 'USDC',
      amount: body.amount,
      to: body.to,
      purposeCode: body.purposeCode || 'vendor',
      chainId,
      expiry,
      nonce,
      createdAt: Math.floor(Date.now() / 1000),
    };

    const { IntentSchema, hashIntent, hashPolicy } = await import('../types/schemas.js');
    const validated = IntentSchema.parse(intentData);
    const intentHash = hashIntent(validated);

    const intentId = await prisma.intent.create({
      data: {
        id: await (await import('uuid')).v4(),
        requestId: intentData.requestId,
        orgId: agent.orgId,
        agentId: agent.agentId,
        intentHash,
        payload: JSON.stringify(validated),
        status: 'PENDING',
      },
    }).then(i => i.id);

    const { getPolicy } = await import('../services/policy.service.js');
    const policy = await getPolicy(agent.policyId);
    const policyHash = hashPolicy(policy);

    const signerConfig = await prisma.signerConfig.findUnique({ where: { id: 'singleton' } });
    const signerMode = (signerConfig?.mode || process.env.SIGNER_MODE || 'mock') as 'mock' | 'fcc';
    
    const { createSigner } = await import('../services/signer.service.js');
    const signer = createSigner(signerMode, signerConfig ? { 
      endpoint: signerConfig.endpoint, 
      codeHash: signerConfig.codeHash 
    } : undefined);

    let decisionStatus: 'APPROVED' | 'DENIED' | 'NEEDS_APPROVAL';
    let decisionHash: `0x${string}`;
    let codeHash: `0x${string}`;
    let signerResponse;
    let approvalsRequired: number;
    let reasons: string[];

    if (signerMode === 'fcc') {
      signerResponse = await signer.sign({
        mode: 'FULL_COMPUTE',
        intent: validated,
        policy,
        intentHash: intentHash as `0x${string}`,
        policyHash: policyHash as `0x${string}`,
      });
      codeHash = signerResponse.codeHash;
      decisionHash = signerResponse.decisionHash;
      const meta = signerResponse.metadata as any;
      decisionStatus = meta.decisionStatus;
      approvalsRequired = meta.approvalsRequired;
      reasons = meta.reasons;
    } else {
      const { evaluate } = await import('../services/policy.service.js');
      const result = evaluate(validated, policy);
      decisionStatus = result.status;
      approvalsRequired = result.approvalsRequired;
      reasons = result.reasons;
      codeHash = signer.getCodeHash();

      const { hashDecision } = await import('../types/schemas.js');
      decisionHash = hashDecision({
        intentHash: intentHash as `0x${string}`,
        policyHash: policyHash as `0x${string}`,
        codeHash,
        decisionStatus,
        expiry,
        nonce,
      });

      signerResponse = await signer.sign({ mode: 'SIGN_HASH', decisionHash, codeHash });
    }

    const permit = {
      intentHash,
      policyHash,
      codeHash,
      decisionStatus,
      decisionHash,
      expiry,
      nonce,
      signerType: signerResponse.signerType,
      teeSignature: signerResponse.teeSignature,
      teeIdentity: signerResponse.teeIdentity,
      approvalsRequired,
      reasons,
    };

    await prisma.decision.create({
      data: {
        intentId,
        status: decisionStatus,
        policyHash,
        codeHash,
        decisionHash,
        signerType: signerResponse.signerType,
        teeSignature: signerResponse.teeSignature,
        teeIdentity: signerResponse.teeIdentity,
        approvalsRequired,
        reasons: reasons?.join(', ') || null,
        payload: JSON.stringify(permit),
      },
    });

    await prisma.intent.update({
      where: { id: intentId },
      data: { status: decisionStatus },
    });

    if (decisionStatus !== 'APPROVED') {
      return reply.send({
        intentId,
        intentHash,
        decisionStatus,
        reasons,
        executed: false,
      });
    }

    const actionGateAbi = parseAbi([
      'function executeWithPermit(((bytes32 intentHash,bytes32 policyHash,bytes32 codeHash,uint8 decisionStatus,bytes32 decisionHash,uint256 expiry,bytes32 nonce,bytes teeSignature) permit,(address approver, bytes signature)[] approvalSigs,address token,address to,uint256 amount) params) external',
    ]);

    const STATUS_MAP: Record<string, number> = { APPROVED: 0, DENIED: 1, NEEDS_APPROVAL: 2 };

    try {
      const publicClient = createPublicClient({ chain, transport: http(rpc) });
      const walletClient = createWalletClient({ account, chain, transport: http(rpc) });

      const txHash = await walletClient.writeContract({
        address: agent.gateAddr as `0x${string}`,
        abi: actionGateAbi,
        functionName: 'executeWithPermit',
        args: [
          {
            permit: {
              intentHash: intentHash as `0x${string}`,
              policyHash: policyHash as `0x${string}`,
              codeHash: codeHash as `0x${string}`,
              decisionStatus: STATUS_MAP[decisionStatus] ?? 0,
              decisionHash: decisionHash as `0x${string}`,
              expiry: BigInt(expiry),
              nonce: nonce as `0x${string}`,
              teeSignature: signerResponse.teeSignature as `0x${string}`,
            },
            approvalSigs: [],
            token: agent.tokenAddr as `0x${string}`,
            to: body.to as `0x${string}`,
            amount: BigInt(body.amount),
          },
        ],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      const evidence = await prisma.evidence.create({
        data: {
          intentId,
          txHash,
          chain: String(chainId),
          registeredAt: new Date(),
        },
      });

      const decision = await prisma.decision.findFirst({ where: { intentId } });
      if (decision) {
        await prisma.proofPack.upsert({
          where: { intentId },
          create: {
            intentId,
            intentHash,
            policyHash,
            codeHash,
            decisionHash,
            teeSignature: signerResponse.teeSignature,
            teeIdentity: signerResponse.teeIdentity,
            signerType: signerResponse.signerType,
            executionTxHash: txHash,
            status: 'settled',
            evidenceRefs: { connect: { id: evidence.id } },
          },
          update: {
            executionTxHash: txHash,
            status: 'settled',
            evidenceRefs: { connect: { id: evidence.id } },
          },
        });
      }

      return reply.send({
        intentId,
        intentHash,
        decisionStatus: 'APPROVED',
        reasons: [],
        executed: true,
        txHash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed.toString(),
      });
    } catch (err: any) {
      return reply.code(500).send({
        intentId,
        intentHash,
        decisionStatus: 'APPROVED',
        executed: false,
        error: `On-chain execution failed: ${err.message}`,
      });
    }
  });
};

function sanitizeAgent(agent: any) {
  const { privateKey, ...safe } = agent;
  return {
    ...safe,
    hasPrivateKey: !!privateKey,
    chainId: agent.chainId || 99999,
  };
}