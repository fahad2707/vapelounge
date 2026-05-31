import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { slugify } from '@/lib/admin/slug'
import type { CategoryDoc, HeaderPageDoc } from '@/lib/db/product-doc'
import { revalidateCatalogCache } from '@/lib/server/revalidate-catalog'

export async function GET() {
  const block = await requireAdmin()
  if (block) return block
  try {
    const db = await getAdminDb()
    const docs = await db
      .collection<HeaderPageDoc>(COL.headerPages)
      .find({})
      .sort({ navOrder: 1, name: 1 })
      .toArray()

    const categoryCounts = await db
      .collection<CategoryDoc>(COL.categories)
      .aggregate<{ _id: string; n: number }>([
        { $match: { headerPageId: { $type: 'string', $ne: '' } } },
        { $group: { _id: '$headerPageId', n: { $sum: 1 } } },
      ])
      .toArray()
    const countMap = new Map(categoryCounts.map(r => [r._id, r.n]))

    return NextResponse.json({
      headerPages: docs.map(d => ({
        id: (d._id as ObjectId).toString(),
        slug: d.slug,
        name: d.name,
        showInNav: d.showInNav !== false,
        navOrder: d.navOrder ?? 999,
        categoryCount: countMap.get((d._id as ObjectId).toString()) ?? 0,
      })),
    })
  } catch (err) {
    console.error('[admin/header-pages GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const block = await requireAdmin()
  if (block) return block
  let body: { name?: string; showInNav?: boolean } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const name = (body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })

  try {
    const db = await getAdminDb()
    const col = db.collection<HeaderPageDoc>(COL.headerPages)
    const slug = slugify(name)
    const existing = await col.findOne({ slug })
    if (existing) {
      return NextResponse.json({ error: 'A header page with this name already exists.' }, { status: 409 })
    }

    const count = await col.countDocuments({})
    const now = new Date()
    const r = await col.insertOne({
      slug,
      name,
      showInNav: body.showInNav !== false,
      navOrder: count + 1,
      createdAt: now,
      updatedAt: now,
    })
    revalidateCatalogCache()
    return NextResponse.json({
      ok: true,
      headerPage: { id: r.insertedId.toString(), slug, name },
    })
  } catch (err) {
    console.error('[admin/header-pages POST]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
