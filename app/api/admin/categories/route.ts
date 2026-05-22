import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { slugify } from '@/lib/admin/slug'
import type { CategoryDoc } from '@/lib/db/product-doc'
import {
  MAX_FEATURED,
  MAX_SHOP_DISPLAY,
  countProductsForCategory,
  syncCategoriesFromProducts,
} from '@/lib/server/categories'

export async function GET(req: Request) {
  const block = await requireAdmin()
  if (block) return block
  try {
    const db = await getAdminDb()
    const synced = await syncCategoriesFromProducts(db)
    const docs = await db
      .collection<CategoryDoc>(COL.categories)
      .find({})
      .sort({ shopDisplay: -1, featured: -1, name: 1 })
      .toArray()

    const categories = await Promise.all(
      docs.map(async d => {
        const id = (d._id as ObjectId).toString()
        return {
          id,
          slug: d.slug,
          name: d.name,
          image: d.image || null,
          featured: !!d.featured,
          shopDisplay: !!d.shopDisplay,
          shopDisplayOrder: d.shopDisplayOrder ?? 999,
          productCount: await countProductsForCategory(db, id, d.name),
        }
      }),
    )

    return NextResponse.json({ categories, synced })
  } catch (err) {
    console.error('[admin/categories GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const block = await requireAdmin()
  if (block) return block
  let body: { name?: string; image?: string | null; featured?: boolean; shopDisplay?: boolean } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const name = (body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Category name is required.' }, { status: 400 })
  const slug = slugify(name)
  const featured = !!body.featured
  const shopDisplay = !!body.shopDisplay
  const image = typeof body.image === 'string' && body.image.trim() ? body.image.trim() : null

  try {
    const db = await getAdminDb()
    const col = db.collection<CategoryDoc>(COL.categories)
    const existing = await col.findOne({ slug })
    if (existing) return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 })

    if (featured) {
      const count = await col.countDocuments({ featured: true })
      if (count >= MAX_FEATURED) {
        return NextResponse.json(
          { error: `You can feature up to ${MAX_FEATURED} categories on the homepage carousel. Unfeature one first.` },
          { status: 409 },
        )
      }
    }
    let shopDisplayOrder = 999
    if (shopDisplay) {
      const shopCount = await col.countDocuments({ shopDisplay: true })
      if (shopCount >= MAX_SHOP_DISPLAY) {
        return NextResponse.json(
          { error: `You can showcase up to ${MAX_SHOP_DISPLAY} categories in the shop. Remove one first.` },
          { status: 409 },
        )
      }
      shopDisplayOrder = shopCount + 1
    }

    const now = new Date()
    const r = await col.insertOne({
      slug,
      name,
      image,
      featured,
      shopDisplay,
      shopDisplayOrder,
      createdAt: now,
      updatedAt: now,
    })
    return NextResponse.json({
      ok: true,
      category: { id: r.insertedId.toString(), slug, name, image, featured, shopDisplay },
    })
  } catch (err) {
    console.error('[admin/categories POST]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
