import { prisma } from '../db.js';

export async function authMiddleware(
  req: any,
  reply: any
) {
  try {
    const skipAuth = req.url === '/health' || req.url === '/admin/api-keys/bootstrap';
    
    if (skipAuth) {
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ error: 'Missing Authorization header' });
    }

    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      return reply.code(401).send({ error: 'Invalid Authorization header format' });
    }

    const apiKey = match[1];
    const keyRecord = await prisma.apiKey.findUnique({ where: { key: apiKey } });

    if (!keyRecord) {
      return reply.code(401).send({ error: 'Invalid API key' });
    }

    if (!keyRecord.active) {
      return reply.code(403).send({ error: 'API key is revoked' });
    }

    req.apiKey = keyRecord;
    req.orgId = keyRecord.orgId;

    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}