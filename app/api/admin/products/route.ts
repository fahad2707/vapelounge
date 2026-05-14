import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { randSuffix, slugify } from '@/lib/admin/slug'
import type { CategoryDoc, ProductDoc } from '@/lib/db/product-doc'

async function categoryNameFor(db: Awaited<ReturnType<typeof getAdminDb>>, id: string | null | undefined): Promise<string | null> {
  if (!id) return null
  let oid: ObjectId
  try { oid = new ObjectId(id) } catch { return null }
  const cat = await db.collection<CategoryDoc>(COL.categories).findOne({ _id: oid })
  return cat?.name ?? null
}

export async function GET() {
  const block = await requireAdmin()
  if (block) return block
  try {
    const db = await getAdminDb()
    const docs = await db
      .collection<ProductDoc>(COL.products)
      .find({}, { projection: { collectionRaw: 0 } })
      .sort({ updatedAt: -1, name: 1 })
      .limit(2000)
      .toArray()
    return NextResponse.json({ products: docs })
  } catch (err) {
    console.error('[admin/products GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

interface CreateProductBody {
  sku?: string | null
  name?: string
  description?: string
  price?: number | string
  costPrice?: number | string | null
  quantity?: number | string | null
  images?: string[]
  categoryId?: string | null
  modelId?: string | null
  brand?: string | null
  primaryCategory?: string | null
}

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number.parseFloat(v)
  return Number.isFinite(n) ? n : null
}

export async function POST(req: Request) {
  const block = await requireAdmin()
  if (block) return block
  let body: CreateProductBody = {}
  try {
    body = (await req.json()) as CreateProductBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const name = (body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 })

  const price = toNum(body.price)
  if (price === null || price < 0) {
    return NextResponse.json({ error: 'Selling price is required and must be ≥ 0.' }, { status: 400 })
  }

  const cost = toNum(body.costPrice ?? null)
  const qty = toNum(body.quantity ?? null)
  const description = (body.description || '').trim()
  const sku = (body.sku || '').trim() || null
  const images = Array.isArray(body.images)
    ? body.images.filter((s): s is string => typeof s === 'string' && s.length > 0).slice(0, 10)
    : []

  const handleId = `${slugify(name)}-${randSuffix()}`

  const db = await getAdminDb()
  const catName = await categoryNameFor(db, body.categoryId)
  const primaryCategory =
    catName ||
    (body.primaryCategory || body.brand || 'Uncategorized').trim() ||
    'Uncategorized'
  const brand = catName || ((body.brand || '').trim() || null)

  const now = new Date()
  const doc: ProductDoc = {
    handleId,
    name,
    descriptionHtml: description ? `<p>${description.replace(/\n+/g, '</p><p>')}</p>` : '',
    descriptionPlain: description,
    images,
    image: images[0] || '',
    primaryCategory,
    categories: primaryCategory ? [primaryCategory] : [],
    price,
    compareAtPrice: null,
    badge: null,
    inStock: qty == null ? true : qty > 0,
    variants: [],
    sku,
    brand,
    collectionRaw: primaryCategory,
    visible: true,
    accentColor: '#C9A85E',
    costPrice: cost,
    quantity: qty,
    categoryId: body.categoryId || null,
    modelId: body.modelId || null,
    variantGroupId: null,
    createdAt: now,
    updatedAt: now,
  }

  try {
    await db.collection<ProductDoc>(COL.products).insertOne(doc)
    return NextResponse.json({ ok: true, product: doc })
  } catch (err) {
    console.error('[admin/products POST]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
