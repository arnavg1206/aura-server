import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { computeStreak, weeklyMinutes } from '../lib/streak';

async function friendsWithStats(userID: string, prisma: PrismaClient) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'accepted',
      OR: [{ requesterId: userID }, { receiverId: userID }],
    },
    include: { requester: true, receiver: true },
  });

  const friends = friendships.map(f => (f.requesterId === userID ? f.receiver : f.requester));

  return Promise.all(
    friends.map(async friend => {
      const sessions = await prisma.syncedSession.findMany({ where: { userId: friend.id } });
      return {
        id: friend.id,
        displayName: friend.displayName,
        streak: computeStreak(sessions),
        weeklyMinutes: weeklyMinutes(sessions),
      };
    })
  );
}

export async function friendRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // GET /friends
  app.get('/friends', { preHandler: authenticate }, async (req) => {
    return friendsWithStats(req.userID, prisma);
  });

  // GET /friends/leaderboard
  app.get('/friends/leaderboard', { preHandler: authenticate }, async (req) => {
    const list = await friendsWithStats(req.userID, prisma);
    return list.sort((a, b) => b.streak - a.streak);
  });

  // POST /friends/request
  app.post<{ Body: { displayName: string } }>(
    '/friends/request',
    { preHandler: authenticate },
    async (req, reply) => {
      const target = await prisma.user.findFirst({
        where: { displayName: req.body.displayName },
      });
      if (!target) return reply.code(404).send({ error: 'User not found' });
      if (target.id === req.userID) return reply.code(400).send({ error: 'Cannot add yourself' });

      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: req.userID, receiverId: target.id },
            { requesterId: target.id, receiverId: req.userID },
          ],
        },
      });
      if (existing) return reply.code(409).send({ error: 'Friendship already exists' });

      await prisma.friendship.create({
        data: { requesterId: req.userID, receiverId: target.id, status: 'pending' },
      });
      return reply.code(201).send();
    }
  );

  // PUT /friends/:friendshipID/accept
  app.put<{ Params: { friendshipID: string } }>(
    '/friends/:friendshipID/accept',
    { preHandler: authenticate },
    async (req, reply) => {
      const friendship = await prisma.friendship.findUnique({
        where: { id: req.params.friendshipID },
      });
      if (!friendship) return reply.code(404).send({ error: 'Friendship not found' });
      if (friendship.receiverId !== req.userID) {
        return reply.code(403).send({ error: 'Not authorized to accept this request' });
      }
      await prisma.friendship.update({
        where: { id: friendship.id },
        data: { status: 'accepted' },
      });
      return reply.code(200).send();
    }
  );
}
