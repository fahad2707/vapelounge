import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/db/get-db'
import { distinctShopBrands } from '@/lib/server/categories'

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
}

const getBrands = unstable_cache(
  async () => {
    const db = await getDb()
    if (!db) return ['All brands']
    const labels = await distinctShopBrands(db)
    return ['All brands', ...labels]
  },
  ['vapelounge-product-brands'],
  { revalidate: 300 },
)

export async function GET() {
  try {
    const brands = await getBrands()
    return NextResponse.json({ brands }, { headers: CACHE_HEADER })
  } catch (err) {
    console.error('[api/products/brands]', err)
    return NextResponse.json({ brands: ['All brands'] }, { headers: CACHE_HEADER })
  }
}
