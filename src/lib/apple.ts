import { createRemoteJWKSet, jwtVerify } from 'jose';

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export async function verifyAppleToken(identityToken: string): Promise<string> {
  const appID = process.env.APPLE_APP_ID ?? 'com.arnavgupta.meditationapp';
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: appID,
  });
  if (typeof payload.sub !== 'string') throw new Error('No sub in Apple token');
  return payload.sub;
}
