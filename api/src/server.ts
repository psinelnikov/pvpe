import Fastify from 'fastify';
import { intentRoutes } from './routes/intents.js';
import { evidenceRoutes } from './routes/evidence.js';
import { proofpackRoutes } from './routes/proofpacks.js';
import { policyRoutes } from './routes/policies.js';
import { agentRoutes } from './routes/agents.js';
import { adminRoutes } from './routes/admin.js';
import { authMiddleware } from './middleware/auth.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(import('@fastify/cors'), {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  app.addHook('onRequest', authMiddleware);

  await app.register(intentRoutes, { prefix: '/intents' });
  await app.register(evidenceRoutes, { prefix: '/evidence' });
  await app.register(proofpackRoutes, { prefix: '/proofpacks' });
  await app.register(policyRoutes, { prefix: '/policies' });
  await app.register(agentRoutes, { prefix: '/agents' });
  await app.register(adminRoutes, { prefix: '/admin' });

  app.get('/health', async () => ({ status: 'ok', ts: Date.now() }));

  return app;
}