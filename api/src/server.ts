import Fastify from 'fastify';
import { intentRoutes } from './routes/intents.js';
import { evidenceRoutes } from './routes/evidence.js';
import { proofpackRoutes } from './routes/proofpacks.js';
import { policyRoutes } from './routes/policies.js';
import { agentRoutes } from './routes/agents.js';
import { adminRoutes } from './routes/admin.js';
import { lendingRoutes } from './routes/lending.js';
import { authMiddleware } from './middleware/auth.js';
import { prisma } from './db.js';

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(import('@fastify/cors'), {
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
  });

  app.addHook('onRequest', authMiddleware);

  await app.register(intentRoutes, { prefix: '/intents' });
  await app.register(evidenceRoutes, { prefix: '/evidence' });
  await app.register(proofpackRoutes, { prefix: '/proofpacks' });
  await app.register(policyRoutes, { prefix: '/policies' });
  await app.register(agentRoutes, { prefix: '/agents' });
  await app.register(adminRoutes, { prefix: '/admin' });
  await app.register(lendingRoutes, { prefix: '/lending' });

  app.get('/health', async () => ({ status: 'ok', ts: Date.now() }));

  return app;
}