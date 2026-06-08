import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getDb } from '@/lib/db/get-db'
import type { CategoryDoc } from '@/lib/db/product-doc'
import { MAX_FEATURED, countProductsForCategory } from '@/lib/server/categories'

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
}

export interface FeaturedCategory {
  id: string
  slug: string
  name: string
  image: string | null
  productCount: number
}

export async function GET() {
  const db = await getDb()
  if (!db) {
    return NextResponse.json({ categories: [] as FeaturedCategory[] }, { headers: CACHE_HEADER })
  }

  try {
    const cats = await db
      .collection<CategoryDoc>(COL.categories)
      .find({ featured: true })
      .sort({ name: 1 })
      .limit(MAX_FEATURED)
      .toArray()

    const out: FeaturedCategory[] = await Promise.all(
      cats.map(async c => {
        const id = (c._id as ObjectId).toString()
        return {
          id,
          slug: c.slug,
          name: c.name,
          image: c.image || null,
          productCount: await countProductsForCategory(db, id, c.name, c.matchType),
        }
      }),
    )
    return NextResponse.json({ categories: out }, { headers: CACHE_HEADER })
  } catch (err) {
    console.error('[api/categories/featured]', err)
    return NextResponse.json({ categories: [] as FeaturedCategory[] }, { headers: CACHE_HEADER })
  }
}
