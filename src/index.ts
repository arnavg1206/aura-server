import 'dotenv/config';
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { sessionRoutes } from './routes/sessions';
import { friendRoutes } from './routes/friends';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

async function connectWithRetry(retries = 5, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect();
      app.log.info('Database connected');
      return;
    } catch (err) {
      app.log.warn(`DB connect attempt ${i}/${retries} failed, retrying in ${delayMs}ms...`);
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function start() {
  await connectWithRetry();

  app.get('/', async () => 'Aura API is running');

  await authRoutes(app, prisma);
  await sessionRoutes(app, prisma);
  await friendRoutes(app, prisma);

  const port = Number(process.env.PORT ?? 8080);
  await app.listen({ port, host: '0.0.0.0' });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
