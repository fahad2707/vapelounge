import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { slugify } from '@/lib/admin/slug'
import type { ModelDoc, CategoryDoc } from '@/lib/db/product-doc'

export async function GET() {
  const block = await requireAdmin()
  if (block) return block
  try {
    const db = await getAdminDb()
    const docs = await db
      .collection<ModelDoc>(COL.models)
      .find({})
      .sort({ name: 1 })
      .toArray()
    return NextResponse.json({
      models: docs.map(d => ({
        id: (d._id as ObjectId).toString(),
        slug: d.slug,
        name: d.name,
        categoryId: d.categoryId,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const block = await requireAdmin()
  if (block) return block
  let body: { name?: string; categoryId?: string } = {}
  try { body = (await req.json()) as typeof body } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const name = (body.name || '').trim()
  const categoryId = (body.categoryId || '').trim()
  if (!name) return NextResponse.json({ error: 'Model name is required.' }, { status: 400 })
  if (!categoryId) return NextResponse.json({ error: 'Pick a parent category for this model.' }, { status: 400 })

  let catOid: ObjectId
  try { catOid = new ObjectId(categoryId) } catch { return NextResponse.json({ error: 'Invalid category id' }, { status: 400 }) }

  try {
    const db = await getAdminDb()
    const cat = await db.collection<CategoryDoc>(COL.categories).findOne({ _id: catOid })
    if (!cat) return NextResponse.json({ error: 'Parent category does not exist.' }, { status: 400 })

    const slug = slugify(name)
    const existing = await db.collection<ModelDoc>(COL.models).findOne({ slug, categoryId })
    if (existing) return NextResponse.json({ error: 'A model with this name already exists in that category.' }, { status: 409 })

    const now = new Date()
    const r = await db
      .collection<ModelDoc>(COL.models)
      .insertOne({ slug, name, categoryId, createdAt: now, updatedAt: now })
    return NextResponse.json({ ok: true, model: { id: r.insertedId.toString(), slug, name, categoryId } })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
