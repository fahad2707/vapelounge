import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { randSuffix, slugify } from '@/lib/admin/slug'
import type { CategoryDoc, ProductDoc } from '@/lib/db/product-doc'
import {
  ADMIN_PRODUCTS_PAGE_SIZE,
  cacheKeyForGrid,
  clearAdminProductsCache,
  getCachedAdminProducts,
  listAdminProductsForGrid,
  setCachedAdminProducts,
} from '@/lib/server/admin-products'
import { formatMongoError } from '@/lib/mongodb'
import { revalidateCatalogCache } from '@/lib/server/revalidate-catalog'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ADMIN_PRODUCT_SLIM_PROJECTION = {
  handleId: 1,
  name: 1,
  image: 1,
  brand: 1,
  variantGroupId: 1,
  visible: 1,
} as const

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
  const slim = searchParams.get('slim') === '1'
  const limit = parseIntSafe(
    searchParams.get('limit'),
    slim ? 500 : ADMIN_PRODUCTS_PAGE_SIZE,
    20,
    slim ? 1000 : 1500,
  )
  const skip = parseIntSafe(searchParams.get('skip'), 0, 0, 50_000)
  const q = searchParams.get('q')?.trim() || ''
  const includeTotal = searchParams.get('total') === '1'

  try {
    if (slim) {
      const db = await getAdminDb()
      const col = db.collection<ProductDoc>(COL.products)
      const filter = q
        ? {
            $or: [
              { name: { $regex: q, $options: 'i' } },
              { sku: { $regex: q, $options: 'i' } },
              { brand: { $regex: q, $options: 'i' } },
            ],
          }
        : {}
      const docs = await col
        .find(filter, { projection: ADMIN_PRODUCT_SLIM_PROJECTION })
        .sort(q ? { name: 1 } : { _id: -1 })
        .skip(skip)
        .limit(limit + 1)
        .maxTimeMS(12_000)
        .toArray()
      const hasMore = docs.length > limit
      const page = hasMore ? docs.slice(0, limit) : docs
      return NextResponse.json({
        products: page.map(d => ({
          handleId: d.handleId,
          name: d.name,
          image: d.image || '',
          brand: d.brand ?? null,
          variantGroupId: d.variantGroupId ?? null,
          visible: d.visible !== false,
        })),
        hasMore,
        limit,
        skip,
      })
    }

    const cacheKey = cacheKeyForGrid(skip, limit, q)
    const cached = getCachedAdminProducts(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const db = await getAdminDb()
    const result = await listAdminProductsForGrid(db, { skip, limit, q, includeTotal })
    setCachedAdminProducts(cacheKey, result)
    return NextResponse.json(result)
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
    clearAdminProductsCache()
    revalidateCatalogCache()
    return NextResponse.json({ ok: true, product: doc })
  } catch (err) {
    console.error('[admin/products POST]', err)
    return NextResponse.json({ error: formatMongoError(err) }, { status: 500 })
  }
}
