import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '../config/env';

type AuthTokenPayload = {
  sub: string;
  nombre: string;
  email: string;
  rol: string;
  exp: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function signSegment(value: string) {
  return createHmac('sha256', env.authSecret).update(value).digest('base64url');
}

export function createAuthToken(input: Omit<AuthTokenPayload, 'exp'>) {
  const payload: AuthTokenPayload = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + env.authTtlSeconds,
  };

  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  const signature = signSegment(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

export function verifyAuthToken(token: string) {
  const [header, body, signature] = String(token || '').split('.');

  if (!header || !body || !signature) {
    return null;
  }

  const expected = signSegment(`${header}.${body}`);

  if (expected.length !== signature.length) {
    return null;
  }

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  const payload = fromBase64Url<AuthTokenPayload>(body);

  if (!payload?.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export type { AuthTokenPayload };
