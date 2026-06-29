import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

export async function sessionRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // POST /sessions/sync
  app.post<{ Body: { sessions: { date: string; durationSeconds: number }[] } }>(
    '/sessions/sync',
    { preHandler: authenticate },
    async (req, reply) => {
      const { sessions } = req.body;

      if (!Array.isArray(sessions) || sessions.length === 0) {
        return reply.code(400).send({ error: 'sessions must be a non-empty array' });
      }
      if (sessions.length > 1000) {
        return reply.code(400).send({ error: 'Max 1000 sessions per sync' });
      }

      for (const s of sessions) {
        if (!Number.isInteger(s.durationSeconds) || s.durationSeconds <= 0 || s.durationSeconds > 86400) {
          return reply.code(400).send({ error: 'durationSeconds must be between 1 and 86400' });
        }
        const d = new Date(s.date);
        if (isNaN(d.getTime())) {
          return reply.code(400).send({ error: `Invalid date: ${s.date}` });
        }
      }

      await prisma.syncedSession.createMany({
        data: sessions.map(s => ({
          userId: req.userID,
          date: new Date(s.date),
          durationSeconds: s.durationSeconds,
        })),
        skipDuplicates: true,
      });
      return reply.code(200).send();
    }
  );

  // GET /me
  app.get('/me', { preHandler: authenticate }, async (req, reply) => {
    const user = await prisma.user.findUnique({ where: { id: req.userID } });
    if (!user) return reply.code(404).send({ error: 'User not found' });
    return { id: user.id, displayName: user.displayName };
  });
}
