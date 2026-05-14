import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import type { CategoryDoc, ProductDoc } from '@/lib/db/product-doc'

async function categoryNameFor(db: Awaited<ReturnType<typeof getAdminDb>>, id: string | null | undefined): Promise<string | null> {
  if (!id) return null
  let oid: ObjectId
  try { oid = new ObjectId(id) } catch { return null }
  const cat = await db.collection<CategoryDoc>(COL.categories).findOne({ _id: oid })
  return cat?.name ?? null
}

type Patch = Partial<{
  visible: boolean
  name: string
  description: string
  sku: string | null
  price: number
  costPrice: number | null
  quantity: number | null
  images: string[]
  categoryId: string | null
  modelId: string | null
  brand: string | null
  primaryCategory: string | null
}>

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const block = await requireAdmin()
  if (block) return block
  const { id } = await ctx.params
  const handleId = decodeURIComponent(id || '').trim()
  if (!handleId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  let body: Patch = {}
  try {
    body = (await req.json()) as Patch
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof body.visible === 'boolean') update.visible = body.visible
  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
  if (typeof body.description === 'string') {
    const desc = body.description.trim()
    update.descriptionPlain = desc
    update.descriptionHtml = desc ? `<p>${desc.replace(/\n+/g, '</p><p>')}</p>` : ''
  }
  if ('sku' in body) update.sku = body.sku == null ? null : String(body.sku).trim() || null
  if ('price' in body) {
    const n = toNum(body.price)
    if (n !== null) update.price = n
  }
  if ('costPrice' in body) update.costPrice = toNum(body.costPrice)
  if ('quantity' in body) {
    const q = toNum(body.quantity)
    update.quantity = q
    update.inStock = q == null ? true : q > 0
  }
  if (Array.isArray(body.images)) {
    const arr = body.images.filter((s): s is string => typeof s === 'string' && s.length > 0).slice(0, 10)
    update.images = arr
    update.image = arr[0] || ''
  }
  if ('categoryId' in body) update.categoryId = body.categoryId || null
  if ('modelId' in body) update.modelId = body.modelId || null
  if ('brand' in body) update.brand = body.brand?.toString().trim() || null
  if ('primaryCategory' in body && body.primaryCategory) {
    update.primaryCategory = body.primaryCategory.trim()
    update.categories = [body.primaryCategory.trim()]
  }

  try {
    const db = await getAdminDb()

    if ('categoryId' in body) {
      const catName = await categoryNameFor(db, body.categoryId)
      if (catName) {
        update.brand = catName
        update.primaryCategory = catName
        update.categories = [catName]
      }
    }

    const r = await db
      .collection<ProductDoc>(COL.products)
      .findOneAndUpdate({ handleId }, { $set: update }, { returnDocument: 'after' })
    if (!r) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ ok: true, product: r })
  } catch (err) {
    console.error('[admin/products PATCH]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const block = await requireAdmin()
  if (block) return block
  const { id } = await ctx.params
  const handleId = decodeURIComponent(id || '').trim()
  if (!handleId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const db = await getAdminDb()
    const r = await db.collection<ProductDoc>(COL.products).deleteOne({ handleId })
    if (r.deletedCount === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/products DELETE]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
