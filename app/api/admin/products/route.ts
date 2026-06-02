import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { randSuffix, slugify } from '@/lib/admin/slug'
import type { CategoryDoc, ProductDoc } from '@/lib/db/product-doc'
import { stripHtml } from '@/lib/catalog/html'
import { ADMIN_PRODUCT_LIST_PROJECTION } from '@/lib/server/brand-filter'
import { formatMongoError } from '@/lib/mongodb'
import { revalidateCatalogCache } from '@/lib/server/revalidate-catalog'

function descriptionForAdmin(d: ProductDoc): string {
  const plain = (d.descriptionPlain || '').trim()
  if (plain) return plain
  return stripHtml(d.descriptionHtml || '')
}

function parseIntSafe(v: string | null, fallback: number, min: number, max: number) {
  const n = Number.parseInt(v ?? '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

async function categoryNameFor(db: Awaited<ReturnType<typeof getAdminDb>>, id: string | null | undefined): Promise<string | null> {
  if (!id) return null
  let oid: ObjectId
  try { oid = new ObjectId(id) } catch { return null }
  const cat = await db.collection<CategoryDoc>(COL.categories).findOne({ _id: oid })
  return cat?.name ?? null
}

export async function GET(req: Request) {
  const block = await requireAdmin()
  if (block) return block
  const { searchParams } = new URL(req.url)
  const limit = parseIntSafe(searchParams.get('limit'), 80, 20, 200)
  const skip = parseIntSafe(searchParams.get('skip'), 0, 0, 50_000)
  const q = searchParams.get('q')?.trim().toLowerCase() || ''

  try {
    const db = await getAdminDb()
    const col = db.collection<ProductDoc>(COL.products)
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { sku: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } },
            { primaryCategory: { $regex: q, $options: 'i' } },
          ],
        }
      : {}

    const docs = await col
      .find(filter, { projection: ADMIN_PRODUCT_LIST_PROJECTION })
      .sort({ updatedAt: -1, name: 1 })
      .skip(skip)
      .limit(limit + 1)
      .toArray()

    const hasMore = docs.length > limit
    const page = hasMore ? docs.slice(0, limit) : docs

    return NextResponse.json({
      products: page.map(d => {
        const images =
          d.images?.length ? d.images : d.image ? [d.image] : []
        return {
          handleId: d.handleId,
          name: d.name,
          sku: d.sku ?? null,
          image: images[0] || d.image || '',
          images,
          price: d.price,
          costPrice: d.costPrice ?? null,
          quantity: d.quantity ?? null,
          visible: d.visible !== false,
          inStock: d.inStock !== false,
          primaryCategory: d.primaryCategory,
          brand: d.brand ?? null,
          descriptionPlain: descriptionForAdmin(d),
          categoryId: d.categoryId ?? null,
          modelId: d.modelId ?? null,
        }
      }),
      hasMore,
      limit,
      skip,
    })
  } catch (err) {
    console.error('[admin/products GET]', err)
    return NextResponse.json({ error: formatMongoError(err) }, { status: 500 })
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
    revalidateCatalogCache()
    return NextResponse.json({ ok: true, product: doc })
  } catch (err) {
    console.error('[admin/products POST]', err)
    return NextResponse.json({ error: formatMongoError(err) }, { status: 500 })
  }
}
