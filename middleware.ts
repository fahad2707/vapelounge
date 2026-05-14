import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ADMIN_COOKIE } from '@/lib/admin/constants'

/**
 * Edge-runtime safe pre-check. Does NOT verify the HMAC signature
 * (that needs node:crypto and happens inside server routes/pages).
 * It only:
 *  - blocks unauthenticated traffic to /admin/** (except /admin/login),
 *  - blocks unauthenticated traffic to /api/admin/** (except the login route),
 *  - rejects obviously expired or malformed tokens.
 */
function b64urlDecode(s: string): string {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  try {
    return atob(s)
  } catch {
    return ''
  }
}

function looksValid(token: string | undefined): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const raw = b64urlDecode(parts[0])
  if (!raw) return false
  try {
    const p = JSON.parse(raw) as { exp?: number; email?: string }
    if (!p.exp || !p.email) return false
    if (p.exp < Math.floor(Date.now() / 1000)) return false
    return true
  } catch {
    return false
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(ADMIN_COOKIE)?.value

  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/login' || pathname === '/api/admin/login/') return NextResponse.next()
    if (!looksValid(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/login/') {
      if (looksValid(token)) {
        const url = req.nextUrl.clone()
        url.pathname = '/admin/products'
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }
    if (!looksValid(token)) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
