import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db.js';
import { v4 as uuid } from 'uuid';

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api-keys/bootstrap', async (req, reply) => {
    const existingKeys = await prisma.apiKey.count();
    if (existingKeys > 0) {
      return reply.code(400).send({ error: 'API keys already exist' });
    }

    const body = req.body as { orgId: string; name: string };
    const apiKey = `ap_${uuid().replace(/-/g, '')}`;
    const prefix = apiKey.slice(0, 10);

    const key = await prisma.apiKey.create({
      data: {
        key: apiKey,
        prefix,
        orgId: body.orgId,
        name: body.name,
      },
    });

    return reply.code(201).send({
      id: key.id,
      key: apiKey,
      prefix,
      orgId: key.orgId,
      name: key.name,
      message: 'Save this key — it will not be shown again.',
    });
  });

  app.get('/api-keys', async (req, reply) => {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(keys.map(k => ({
      id: k.id,
      prefix: k.prefix,
      name: k.name,
      active: k.active,
      lastUsedAt: k.lastUsedAt,
    })));
  });

  app.post('/api-keys', async (req, reply) => {
    const body = req.body as { name: string; scopes?: string };
    const apiKey = `ap_${uuid().replace(/-/g, '')}`;
    const prefix = apiKey.slice(0, 10);

    const key = await prisma.apiKey.create({
      data: {
        key: apiKey,
        prefix,
        orgId: req.orgId,
        name: body.name,
        scopes: body.scopes || '*',
      },
    });

    return reply.code(201).send({
      id: key.id,
      key: apiKey,
      prefix,
      orgId: key.orgId,
      name: key.name,
      message: 'Save this key — it will not be shown again.',
    });
  });

  app.delete('/api-keys/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.apiKey.update({
      where: { id },
      data: { active: false },
    });
    return reply.code(204).send();
  });

  app.get('/org-stats', async (req, reply) => {
    const agents = await prisma.agent.findMany({
      where: req.orgId ? { orgId: req.orgId } : {},
    });

    const agentIds = agents.map(a => a.agentId);

    const [intents, approved, denied, needsApproval] = await Promise.all([
      prisma.intent.count({ 
        where: req.orgId ? { orgId: req.orgId } : {} 
      }),
      prisma.intent.count({ 
        where: { 
          ...(req.orgId ? { orgId: req.orgId } : {}),
          status: 'APPROVED' 
        } 
      }),
      prisma.intent.count({ 
        where: { 
          ...(req.orgId ? { orgId: req.orgId } : {}),
          status: 'DENIED' 
        } 
      }),
      prisma.intent.count({ 
        where: { 
          ...(req.orgId ? { orgId: req.orgId } : {}),
          status: 'NEEDS_APPROVAL' 
        } 
      }),
    ]);

    const allIntents = await prisma.intent.findMany({
      where: req.orgId ? { orgId: req.orgId } : {},
      select: { payload: true },
    });
    let totalVolume = BigInt(0);
    for (const intent of allIntents) {
      try {
        const parsed = JSON.parse(intent.payload);
        totalVolume += BigInt(parsed.amount || '0');
      } catch { /* skip */ }
    }

    const agentList = await Promise.all(
      agents.map(async (agent) => ({
        agentId: agent.agentId,
        name: agent.name,
        active: agent.active,
        walletAddr: agent.walletAddr,
        intentCount: await prisma.intent.count({ where: { agentId: agent.agentId } }),
        createdAt: agent.createdAt,
      }))
    );

    return reply.send({
      agents: agents.length,
      intents,
      approved,
      denied,
      needsApproval,
      totalVolume: totalVolume.toString(),
      agentList,
    });
  });

  app.get('/audit-log', async (req, reply) => {
    const query = req.query as { limit?: string; action?: string };
    const where: any = req.orgId ? { orgId: req.orgId } : {};
    if (query.action) where.action = query.action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit) || 50,
    });
    return reply.send(logs);
  });

  app.get('/signer-config', async (req, reply) => {
    const config = await prisma.signerConfig.findUnique({ 
      where: { id: 'singleton' } 
    });
    return reply.send(config || {
      mode: 'mock',
      endpoint: 'http://localhost:8001',
      codeHash: '0xaaaa000000000000000000000000000000000000000000000000000000001',
      updatedAt: 'Never',
    });
  });

  app.put('/signer-config', async (req, reply) => {
    const body = req.body as { 
      mode: 'mock' | 'fcc'; 
      endpoint?: string; 
      codeHash?: string 
    };

    await prisma.signerConfig.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        mode: body.mode,
        endpoint: body.endpoint || 'http://localhost:8001',
        codeHash: body.codeHash || '0xaaaa000000000000000000000000000000000000000000000000000000001',
      },
      update: {
        mode: body.mode,
        endpoint: body.endpoint,
        codeHash: body.codeHash,
      },
    });

    const config = await prisma.signerConfig.findUnique({ 
      where: { id: 'singleton' } 
    });
    return reply.send(config);
  });

  app.post('/signer-config/test', async (req, reply) => {
    const { endpoint } = req.body as { endpoint: string };
    const testUrl = endpoint || process.env.TEE_SERVICE_URL || 'http://localhost:8001';

    try {
      const response = await fetch(`${testUrl}/health`, {
        method: 'GET',
      });

      if (response.ok) {
        return reply.send({ status: 'Connected' });
      }

      const response2 = await fetch(testUrl, { method: 'GET' });
      if (response2.ok) {
        return reply.send({ status: 'Reachable' });
      }

      return reply.send({ status: 'Unreachable' });
    } catch {
      return reply.send({ status: 'Unreachable' });
    }
  });
};