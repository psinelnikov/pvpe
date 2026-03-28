import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db.js';
import { PolicySchema, hashPolicy } from '../types/schemas.js';

export const policyRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req, reply) => {
    const policies = await prisma.policy.findMany({ 
      orderBy: { createdAt: 'desc' } 
    });
    return reply.send(policies.map(p => ({
      ...p,
      rules: JSON.parse(p.rulesJson),
    })));
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const policy = await prisma.policy.findUnique({ where: { policyId: id } });
    if (!policy) return reply.code(404).send({ error: 'Policy not found' });
    
    return reply.send({
      ...policy,
      rules: JSON.parse(policy.rulesJson),
    });
  });

  app.post('/', async (req, reply) => {
    const body = PolicySchema.parse(req.body);
    const policyHash = hashPolicy(body);
    
    const policy = await prisma.policy.create({
      data: {
        policyId: body.policyId,
        name: body.name,
        rulesJson: JSON.stringify(body),
      },
    });

    return reply.code(201).send(policy);
  });

  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<{
      name: string;
      perTxLimit: string;
      dailyLimit: string;
      allowedAssets: string[];
      allowedChains: number[];
      allowedPurposeCodes: string[];
      allowedRecipients: string[];
      deniedRecipients: string[];
      approvalRule: {
        thresholdAmount: string;
        required: number;
        approvers: string[];
      };
    }>;

    const existing = await prisma.policy.findUnique({ where: { policyId: id } });
    if (!existing) return reply.code(404).send({ error: 'Policy not found' });

    const rules = { ...JSON.parse(existing.rulesJson), ...body };
    const policyHash = hashPolicy(rules);

    const policy = await prisma.policy.update({
      where: { policyId: id },
      data: {
        rulesJson: JSON.stringify(rules),
      },
    });

    return reply.send({
      ...policy,
      rules,
      policyHash,
    });
  });
};