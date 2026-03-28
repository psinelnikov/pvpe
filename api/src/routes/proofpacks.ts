import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db.js';

export const proofpackRoutes: FastifyPluginAsync = async (app) => {
  app.get('/:intentId', async (req, reply) => {
    const { intentId } = req.params as { id: string };
    const proofpack = await prisma.proofPack.findUnique({ 
      where: { intentId },
      include: { evidenceRefs: true },
    });
    
    if (!proofpack) return reply.code(404).send({ error: 'ProofPack not found' });

    return reply.send(proofpack);
  });
};