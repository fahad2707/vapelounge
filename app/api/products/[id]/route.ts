import { NextResponse } from 'next/server'
import { getProductByHandleId } from '@/lib/server/products'

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const handleId = decodeURIComponent(id || '').trim()
  if (!handleId) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
  }

  const product = await getProductByHandleId(handleId)
  if (product) {
    return NextResponse.json({ source: 'mongodb', product }, { headers: CACHE_HEADER })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
