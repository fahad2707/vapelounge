import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { slugify } from '@/lib/admin/slug'
import type { CategoryDoc, HeaderPageDoc } from '@/lib/db/product-doc'
import { revalidateCatalogCache } from '@/lib/server/revalidate-catalog'

function oid(id: string): ObjectId | null {
  try {
    return new ObjectId(id)
  } catch {
    return null
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const block = await requireAdmin()
  if (block) return block
  const { id } = await ctx.params
  const _id = oid(id)
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const db = await getAdminDb()
    const page = await db.collection<HeaderPageDoc>(COL.headerPages).findOne({ _id })
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const categories = await db
      .collection<CategoryDoc>(COL.categories)
      .find({ headerPageId: id })
      .sort({ navOrder: 1, name: 1 })
      .toArray()

    const allCategories = await db
      .collection<CategoryDoc>(COL.categories)
      .find({})
      .sort({ name: 1 })
      .project({ name: 1, slug: 1, headerPageId: 1 })
      .toArray()

    return NextResponse.json({
      headerPage: {
        id,
        slug: page.slug,
        name: page.name,
        showInNav: page.showInNav !== false,
        navOrder: page.navOrder ?? 999,
      },
      categories: categories.map(c => ({
        id: (c._id as ObjectId).toString(),
        slug: c.slug,
        name: c.name,
        navOrder: c.navOrder ?? 999,
      })),
      availableCategories: allCategories.map(c => ({
        id: (c._id as ObjectId).toString(),
        slug: c.slug,
        name: c.name,
        headerPageId: c.headerPageId ?? null,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const block = await requireAdmin()
  if (block) return block
  const { id } = await ctx.params
  const _id = oid(id)
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: { name?: string; showInNav?: boolean; navOrder?: number } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof body.name === 'string' && body.name.trim()) {
    update.name = body.name.trim()
    update.slug = slugify(body.name)
  }
  if ('showInNav' in body) update.showInNav = !!body.showInNav
  if (typeof body.navOrder === 'number' && Number.isFinite(body.navOrder)) {
    update.navOrder = body.navOrder
  }

  try {
    const db = await getAdminDb()
    await db.collection<HeaderPageDoc>(COL.headerPages).updateOne({ _id }, { $set: update })
    revalidateCatalogCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const block = await requireAdmin()
  if (block) return block
  const { id } = await ctx.params
  const _id = oid(id)
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const db = await getAdminDb()
    await db.collection<CategoryDoc>(COL.categories).updateMany(
      { headerPageId: id },
      { $set: { headerPageId: null, updatedAt: new Date() } },
    )
    const r = await db.collection<HeaderPageDoc>(COL.headerPages).deleteOne({ _id })
    if (r.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    revalidateCatalogCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
