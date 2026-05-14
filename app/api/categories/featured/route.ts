import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getMongoClientPromise, getDbName } from '@/lib/mongodb'
import type { CategoryDoc, ProductDoc } from '@/lib/db/product-doc'

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
  const promise = getMongoClientPromise()
  if (!promise) {
    return NextResponse.json({ categories: [] as FeaturedCategory[] }, { headers: CACHE_HEADER })
  }

  try {
    const client = await promise
    const db = client.db(getDbName())
    const cats = await db
      .collection<CategoryDoc>(COL.categories)
      .find({ featured: true })
      .sort({ name: 1 })
      .limit(6)
      .toArray()

    const products = db.collection<ProductDoc>(COL.products)
    const counts = await Promise.all(
      cats.map(c => products.countDocuments({ categoryId: (c._id as ObjectId).toString(), visible: true })),
    )

    const out: FeaturedCategory[] = cats.map((c, i) => ({
      id: (c._id as ObjectId).toString(),
      slug: c.slug,
      name: c.name,
      image: c.image || null,
      productCount: counts[i],
    }))
    return NextResponse.json({ categories: out }, { headers: CACHE_HEADER })
  } catch (err) {
    console.error('[api/categories/featured]', err)
    return NextResponse.json({ categories: [] as FeaturedCategory[] }, { headers: CACHE_HEADER })
  }
}
