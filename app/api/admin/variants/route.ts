import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import type { VariantGroupDoc, ProductDoc } from '@/lib/db/product-doc'

export async function GET() {
  const block = await requireAdmin()
  if (block) return block
  try {
    const db = await getAdminDb()
    const groups = await db
      .collection<VariantGroupDoc>(COL.variantGroups)
      .find({})
      .sort({ name: 1 })
      .toArray()
    return NextResponse.json({
      groups: groups.map(g => ({
        id: (g._id as ObjectId).toString(),
        name: g.name,
        productHandleIds: g.productHandleIds || [],
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const block = await requireAdmin()
  if (block) return block
  let body: { name?: string; productHandleIds?: string[] } = {}
  try { body = (await req.json()) as typeof body } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const name = (body.name || '').trim()
  const handleIds = Array.isArray(body.productHandleIds)
    ? body.productHandleIds.filter((s): s is string => typeof s === 'string' && s.length > 0)
    : []
  if (!name) return NextResponse.json({ error: 'Variant group name is required.' }, { status: 400 })
  if (handleIds.length < 2) {
    return NextResponse.json({ error: 'Pick at least 2 products to club together.' }, { status: 400 })
  }

  try {
    const db = await getAdminDb()
    const now = new Date()
    const r = await db.collection<VariantGroupDoc>(COL.variantGroups).insertOne({
      name,
      productHandleIds: handleIds,
      createdAt: now,
      updatedAt: now,
    })
    const groupId = r.insertedId.toString()

    await db.collection<ProductDoc>(COL.products).updateMany(
      { handleId: { $in: handleIds } },
      { $set: { variantGroupId: groupId, updatedAt: now } },
    )

    return NextResponse.json({ ok: true, group: { id: groupId, name, productHandleIds: handleIds } })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
