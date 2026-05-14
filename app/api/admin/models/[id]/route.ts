import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { slugify } from '@/lib/admin/slug'
import type { ModelDoc } from '@/lib/db/product-doc'

function oid(id: string): ObjectId | null {
  try { return new ObjectId(id) } catch { return null }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const block = await requireAdmin()
  if (block) return block
  const { id } = await ctx.params
  const _id = oid(id)
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  try {
    const db = await getAdminDb()
    const m = await db.collection<ModelDoc>(COL.models).findOne({ _id })
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      model: {
        id: (m._id as ObjectId).toString(),
        slug: m.slug,
        name: m.name,
        categoryId: m.categoryId,
      },
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
  let body: { name?: string; categoryId?: string } = {}
  try { body = (await req.json()) as typeof body } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof body.name === 'string' && body.name.trim()) {
    update.name = body.name.trim()
    update.slug = slugify(body.name)
  }
  if (typeof body.categoryId === 'string' && body.categoryId.trim()) update.categoryId = body.categoryId.trim()

  try {
    const db = await getAdminDb()
    await db.collection<ModelDoc>(COL.models).updateOne({ _id }, { $set: update })
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
    const r = await db.collection<ModelDoc>(COL.models).deleteOne({ _id })
    if (r.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
