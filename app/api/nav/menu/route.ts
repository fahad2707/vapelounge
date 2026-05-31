import { NextResponse } from 'next/server'
import { getNavMenu } from '@/lib/server/nav-menu'

export const dynamic = 'force-dynamic'

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
}

export async function GET() {
  try {
    const pages = await getNavMenu()
    return NextResponse.json({ pages, categories: pages }, { headers: CACHE_HEADER })
  } catch (err) {
    console.error('[api/nav/menu]', err)
    return NextResponse.json({ pages: [], categories: [] }, { status: 503, headers: CACHE_HEADER })
  }
}
