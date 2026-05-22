import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/get-db'
import { listShopDisplayCategories } from '@/lib/server/categories'

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
}

const getCachedShopDisplay = unstable_cache(
  async () => {
    const db = await getDb()
    if (!db) return []
    return listShopDisplayCategories(db)
  },
  ['vapelounge-shop-display'],
  { revalidate: 90 },
)

export async function GET() {
  try {
    const categories = await getCachedShopDisplay()
    return NextResponse.json({ categories }, { headers: CACHE_HEADER })
  } catch (err) {
    console.error('[api/categories/shop-display]', err)
    return NextResponse.json({ categories: [] }, { headers: CACHE_HEADER })
  }
}
