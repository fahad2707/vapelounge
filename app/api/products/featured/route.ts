import { NextResponse } from 'next/server'
import {
  SHOP_FEATURED_BRANDS,
  SHOP_FEATURED_PRODUCTS,
} from '@/lib/catalog/shop-featured-static'

export const dynamic = 'force-static'

const CACHE_HEADER = {
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
}

/** Static featured grid — served from bundled JSON (no MongoDB). */
export async function GET() {
  return NextResponse.json(
    {
      source: 'static' as const,
      products: SHOP_FEATURED_PRODUCTS,
      brands: SHOP_FEATURED_BRANDS,
      total: SHOP_FEATURED_PRODUCTS.length,
    },
    { headers: CACHE_HEADER },
  )
}
