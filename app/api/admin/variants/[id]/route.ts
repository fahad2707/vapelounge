import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import type { ProductDoc, VariantGroupDoc } from '@/lib/db/product-doc'

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
    const g = await db.collection<VariantGroupDoc>(COL.variantGroups).findOne({ _id })
    if (!g) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      group: {
        id: (g._id as ObjectId).toString(),
        name: g.name,
        productHandleIds: g.productHandleIds || [],
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

  let body: { name?: string; productHandleIds?: string[] } = {}
  try { body = (await req.json()) as typeof body } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
  let newHandleIds: string[] | null = null
  if (Array.isArray(body.productHandleIds)) {
    newHandleIds = body.productHandleIds.filter((s): s is string => typeof s === 'string' && s.length > 0)
    if (newHandleIds.length < 2) {
      return NextResponse.json({ error: 'Pick at least 2 products to club together.' }, { status: 400 })
    }
    update.productHandleIds = newHandleIds
  }

  try {
    const db = await getAdminDb()
    const groups = db.collection<VariantGroupDoc>(COL.variantGroups)
    const products = db.collection<ProductDoc>(COL.products)
    const before = await groups.findOne({ _id })
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await groups.updateOne({ _id }, { $set: update })

    if (newHandleIds) {
      const removed = (before.productHandleIds || []).filter(h => !newHandleIds!.includes(h))
      if (removed.length) {
        await products.updateMany({ handleId: { $in: removed } }, { $set: { variantGroupId: null, updatedAt: new Date() } })
      }
      await products.updateMany(
        { handleId: { $in: newHandleIds } },
        { $set: { variantGroupId: id, updatedAt: new Date() } },
      )
    }
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
    const groups = db.collection<VariantGroupDoc>(COL.variantGroups)
    const before = await groups.findOne({ _id })
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await groups.deleteOne({ _id })
    await db.collection<ProductDoc>(COL.products).updateMany(
      { handleId: { $in: before.productHandleIds || [] } },
      { $set: { variantGroupId: null, updatedAt: new Date() } },
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
