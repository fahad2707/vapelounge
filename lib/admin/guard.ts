import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE } from './constants'
import { verifyAdminSession, type AdminSessionPayload } from './auth'

/** Reads + verifies the admin session cookie on a server route. */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE)?.value
  return verifyAdminSession(token)
}

/** Returns a 401 NextResponse if the request is not authenticated, else null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}
