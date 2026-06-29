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
