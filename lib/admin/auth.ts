import { createHmac, timingSafeEqual } from 'node:crypto'
import { ADMIN_SESSION_MAX_AGE_SECONDS } from './constants'

/**
 * Lightweight HMAC-signed session token: `<payloadB64Url>.<sigB64Url>`.
 * Verified on every admin API call and by middleware on every /admin route.
 */
function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.MONGODB_URI?.trim() ||
    'dev-only-fallback-secret-change-me'
  )
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return Buffer.from(s, 'base64')
}

export interface AdminSessionPayload {
  email: string
  iat: number
  exp: number
}

export function signAdminSession(email: string): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSessionPayload = {
    email,
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE_SECONDS,
  }
  const payloadStr = b64url(JSON.stringify(payload))
  const sig = b64url(createHmac('sha256', getSecret()).update(payloadStr).digest())
  return `${payloadStr}.${sig}`
}

export function verifyAdminSession(token: string | undefined | null): AdminSessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadStr, sig] = parts

  let expected: Buffer
  try {
    expected = createHmac('sha256', getSecret()).update(payloadStr).digest()
  } catch {
    return null
  }

  const given = b64urlDecode(sig)
  if (given.length !== expected.length) return null
  if (!timingSafeEqual(given, expected)) return null

  let payload: AdminSessionPayload
  try {
    payload = JSON.parse(b64urlDecode(payloadStr).toString('utf-8')) as AdminSessionPayload
  } catch {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp < now) return null
  if (!payload.email) return null
  return payload
}
