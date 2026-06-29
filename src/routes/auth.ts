import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../lib/jwt';
import { verifyAppleToken } from '../lib/apple';

function tokenResponse(user: { id: string; displayName: string }, token: string) {
  return { token, user: { id: user.id, displayName: user.displayName } };
}

export async function authRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // POST /auth/apple
  app.post<{ Body: { identityToken: string; displayName?: string } }>(
    '/auth/apple',
    async (req, reply) => {
      const { identityToken, displayName } = req.body;
      let appleSubjectId: string;
      try {
        appleSubjectId = await verifyAppleToken(identityToken);
      } catch {
        return reply.code(401).send({ error: 'Invalid Apple token' });
      }

      let user = await prisma.user.findFirst({ where: { appleSubjectId } });
      if (!user) {
        user = await prisma.user.create({
          data: { appleSubjectId, displayName: displayName ?? 'Aura User' },
        });
      }
      return tokenResponse(user, signToken(user.id));
    }
  );

  // POST /auth/google
  app.post<{ Body: { idToken: string; displayName?: string } }>(
    '/auth/google',
    async (req, reply) => {
      const { idToken, displayName } = req.body;
      const clientID = process.env.GOOGLE_CLIENT_ID ?? '';

      let googleSubjectId: string;
      try {
        const { data } = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        );
        if (!clientID || data.aud !== clientID) {
          return reply.code(401).send({ error: 'Invalid Google token audience' });
        }
        googleSubjectId = data.sub;
      } catch {
        return reply.code(401).send({ error: 'Invalid Google token' });
      }

      let user = await prisma.user.findFirst({ where: { googleSubjectId } });
      if (!user) {
        user = await prisma.user.create({
          data: { googleSubjectId, displayName: displayName ?? 'Aura User' },
        });
      }
      return tokenResponse(user, signToken(user.id));
    }
  );

  // POST /auth/register
  app.post<{ Body: { name: string; email: string; password: string } }>(
    '/auth/register',
    async (req, reply) => {
      const { name, email, password } = req.body;
      if (password.length < 8) {
        return reply.code(400).send({ error: 'Password must be at least 8 characters' });
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.code(409).send({ error: 'Email already registered' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { displayName: name, email, passwordHash },
      });
      return reply.code(201).send(tokenResponse(user, signToken(user.id)));
    }
  );

  // POST /auth/login
  app.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    async (req, reply) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) {
        return reply.code(401).send({ error: 'Invalid email or password' });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid email or password' });
      }
      return tokenResponse(user, signToken(user.id));
    }
  );

  // POST /auth/forgot-password (stub)
  app.post<{ Body: { email: string } }>('/auth/forgot-password', async (_req, reply) => {
    return reply.code(200).send();
  });
}
