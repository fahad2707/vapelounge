import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { slugify } from '@/lib/admin/slug'
import type { CategoryDoc } from '@/lib/db/product-doc'

const MAX_FEATURED = 6

export async function GET() {
  const block = await requireAdmin()
  if (block) return block
  try {
    const db = await getAdminDb()
    const docs = await db
      .collection<CategoryDoc>(COL.categories)
      .find({})
      .sort({ featured: -1, name: 1 })
      .toArray()
    return NextResponse.json({
      categories: docs.map(d => ({
        id: (d._id as ObjectId).toString(),
        slug: d.slug,
        name: d.name,
        image: d.image || null,
        featured: !!d.featured,
      })),
    })
  } catch (err) {
    console.error('[admin/categories GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const block = await requireAdmin()
  if (block) return block
  let body: { name?: string; image?: string | null; featured?: boolean } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const name = (body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Category name is required.' }, { status: 400 })
  const slug = slugify(name)
  const featured = !!body.featured
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
          { error: `You can feature up to ${MAX_FEATURED} categories on the homepage. Unfeature one first.` },
          { status: 409 },
        )
      }
    }

    const now = new Date()
    const r = await col.insertOne({ slug, name, image, featured, createdAt: now, updatedAt: now })
    return NextResponse.json({
      ok: true,
      category: { id: r.insertedId.toString(), slug, name, image, featured },
    })
  } catch (err) {
    console.error('[admin/categories POST]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
