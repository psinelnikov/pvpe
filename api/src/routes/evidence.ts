import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../server.js';

export const evidenceRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', async (req, reply) => {
    const body = req.body as {
      intentId: string;
      txHash?: string;
      chain?: string;
      amount?: string;
      asset?: string;
      from?: string;
      to?: string;
    };

    const evidence = await prisma.evidence.create({
      data: {
        intentId: body.intentId,
        txHash: body.txHash,
        chain: body.chain || '99999',
        registeredAt: new Date(),
      },
    });

    return reply.code(201).send(evidence);
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) return reply.code(404).send({ error: 'Evidence not found' });
    return reply.send(evidence);
  });

  app.get('/:id/anchor-status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) return reply.code(404).send({ error: 'Evidence not found' });

    return reply.send({
      evidenceId: evidence.id,
      anchored: !!evidence.anchorHash,
      anchorHash: evidence.anchorHash,
      anchoredAt: evidence.anchoredAt,
    });
  });
};