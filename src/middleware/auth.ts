import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../lib/jwt';

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  try {
    const token = header.slice(7);
    req.userID = verifyToken(token);
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    userID: string;
  }
}
