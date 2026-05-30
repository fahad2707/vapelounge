import { NextResponse } from 'next/server'
import { getShopBrands } from '@/lib/server/shop-brands'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
}

export async function GET() {
  if (!process.env.MONGODB_URI?.trim()) {
    return NextResponse.json({ brands: ['All brands'] }, { headers: CACHE_HEADER })
  }

  try {
    const brands = await getShopBrands()
    return NextResponse.json({ brands }, { headers: CACHE_HEADER })
  } catch (err) {
    console.error('[api/products/brands]', err)
    return NextResponse.json({ brands: ['All brands'] }, { status: 503, headers: CACHE_HEADER })
  }
}
