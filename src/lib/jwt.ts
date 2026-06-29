import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const SEVEN_DAYS = 7 * 24 * 60 * 60;

export function signToken(userID: string): string {
  return jwt.sign({ sub: userID }, SECRET, {
    algorithm: 'HS256',
    expiresIn: SEVEN_DAYS,
  });
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
  if (typeof payload.sub !== 'string') throw new Error('Invalid token');
  return payload.sub;
}
