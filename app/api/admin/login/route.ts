import { NextResponse } from 'next/server'
import { signAdminSession } from '@/lib/admin/auth'
import {
  ADMIN_COOKIE,
  ADMIN_PASSWORD,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  ADMIN_USERNAME,
} from '@/lib/admin/constants'

export async function POST(req: Request) {
  let body: { email?: string; password?: string } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = (body.email || '').trim().toLowerCase()
  const password = body.password || ''

  if (email !== ADMIN_USERNAME.toLowerCase() || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = signAdminSession(email)
  const res = NextResponse.json({ ok: true, email })
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  })
  return res
}
