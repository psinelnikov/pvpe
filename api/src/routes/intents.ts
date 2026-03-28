import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../server.js';
import { IntentSchema, hashIntent } from '../types/schemas.js';
import { v4 as uuid } from 'uuid';

export const intentRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', async (req, reply) => {
    const body = req.body as any;

    const existing = await prisma.intent.findUnique({
      where: { requestId: body.requestId },
    });
    if (existing) {
      return reply.code(200).send({
        intentId: existing.id,
        intentHash: existing.intentHash,
      });
    }

    const intentId = uuid();
    const intent = {
      ...body,
      intentId,
      createdAt: Math.floor(Date.now() / 1000),
    };

    const validated = IntentSchema.parse(intent);
    const intentHash = hashIntent(validated);

    await prisma.intent.create({
      data: {
        id: intentId,
        requestId: body.requestId,
        orgId: body.orgId,
        agentId: body.agentId,
        intentHash,
        payload: JSON.stringify(validated),
        status: 'PENDING',
      },
    });

    return reply.code(201).send({ intentId, intentHash });
  });

  app.post('/:id/decide', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { policyId } = (req.body as any) || {};

    const record = await prisma.intent.findUniqueOrThrow({ where: { id } });
    const intent = JSON.parse(record.payload);
    
    const { getPolicy } = await import('../services/policy.service.js');
    const policy = await getPolicy(policyId || 'pol_standard_bank');
    
    const { hashPolicy, hashDecision } = await import('../types/schemas.js');
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
        intent,
        policy,
        intentHash: record.intentHash as `0x${string}`,
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
      const result = evaluate(intent, policy);
      decisionStatus = result.status;
      approvalsRequired = result.approvalsRequired;
      reasons = result.reasons;
      codeHash = signer.getCodeHash();

      decisionHash = hashDecision({
        intentHash: record.intentHash as `0x${string}`,
        policyHash: policyHash as `0x${string}`,
        codeHash,
        decisionStatus,
        expiry: intent.expiry,
        nonce: intent.nonce,
      });

      signerResponse = await signer.sign({ mode: 'SIGN_HASH', decisionHash, codeHash });
    }

    const permit = {
      intentHash: record.intentHash,
      policyHash,
      codeHash,
      decisionStatus,
      decisionHash,
      expiry: intent.expiry,
      nonce: intent.nonce,
      signerType: signerResponse.signerType,
      teeSignature: signerResponse.teeSignature,
      teeIdentity: signerResponse.teeIdentity,
      approvalsRequired,
      reasons,
    };

    await prisma.decision.create({
      data: {
        intentId: id,
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
      where: { id },
      data: { status: decisionStatus },
    });

    return reply.code(200).send(permit);
  });

  app.post('/:id/approve', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { approver, signature } = req.body as {
      approver: string;
      signature: string;
    };

    const decision = await prisma.decision.findFirstOrThrow({
      where: { intentId: id, status: 'NEEDS_APPROVAL' },
    });

    const crypto = await import('crypto');
    const approvalHash = `0x${crypto
      .createHash('sha256')
      .update(decision.decisionHash + approver)
      .digest('hex')}`;

    const approval = await prisma.approval.create({
      data: {
        decisionId: decision.id,
        approver,
        signature,
        approvalHash,
        timestamp: Math.floor(Date.now() / 1000),
      },
    });

    const count = await prisma.approval.count({ where: { decisionId: decision.id } });
    const permit = JSON.parse(decision.payload);

    if (count >= permit.approvalsRequired) {
      await prisma.decision.update({
        where: { id: decision.id },
        data: { status: 'APPROVED' },
      });
    }

    return reply.code(200).send({
      approvalId: approval.id,
      approvalHash,
      approvalsCollected: count,
      approvalsRequired: permit.approvalsRequired,
      thresholdMet: count >= permit.approvalsRequired,
    });
  });

  app.get('/', async (req, reply) => {
    const query = req.query as { 
      agentId?: string; 
      status?: string; 
      orgId?: string; 
      limit?: string 
    };
    const where: any = {};
    if (req.orgId) where.orgId = req.orgId;
    else if (query.orgId) where.orgId = query.orgId;
    if (query.agentId) where.agentId = query.agentId;
    if (query.status) where.status = query.status;

    const intents = await prisma.intent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit) || 50,
      include: { decisions: { include: { approvals: true } } },
    });
    return reply.send(intents);
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const intent = await prisma.intent.findUniqueOrThrow({
      where: { id },
      include: { decisions: { include: { approvals: true } } },
    });
    return reply.send(intent);
  });
};