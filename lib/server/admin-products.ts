import type { Db } from 'mongodb'
import { COL } from '@/lib/db/collections'
import type { ProductDoc } from '@/lib/db/product-doc'
import { escapeRegex } from '@/lib/server/brand-filter'

/** Admin grid fields only — descriptions load on edit. */
export const ADMIN_PRODUCT_MIN_PROJECTION = {
  handleId: 1,
  name: 1,
  image: 1,
  price: 1,
  compareAtPrice: 1,
  sku: 1,
  brand: 1,
  primaryCategory: 1,
  quantity: 1,
  visible: 1,
  inStock: 1,
  categoryId: 1,
  modelId: 1,
  costPrice: 1,
  categories: 1,
} as const

export interface AdminProductGridRow {
  handleId: string
  name: string
  sku: string | null
  image: string
  images: string[]
  price: number
  compareAtPrice: number | null
  costPrice: number | null
  quantity: number | null
  visible: boolean
  inStock: boolean
  primaryCategory: string
  brand: string | null
  descriptionPlain: string
  categoryId: string | null
  modelId: string | null
  categories?: string[]
}

export interface AdminProductGridResult {
  products: AdminProductGridRow[]
  hasMore: boolean
  limit: number
  skip: number
  total?: number
}

export const ADMIN_PRODUCTS_PAGE_SIZE = 120

function mapDoc(d: ProductDoc): AdminProductGridRow {
  const image = d.image || ''
  return {
    handleId: d.handleId,
    name: d.name,
    sku: d.sku ?? null,
    image,
    images: image ? [image] : [],
    price: d.price ?? 0,
    compareAtPrice: d.compareAtPrice ?? null,
    costPrice: d.costPrice ?? null,
    quantity: d.quantity ?? null,
    visible: d.visible !== false,
    inStock: d.inStock !== false,
    primaryCategory: d.primaryCategory || '',
    brand: d.brand ?? null,
    descriptionPlain: '',
    categoryId: d.categoryId ?? null,
    modelId: d.modelId ?? null,
    categories: d.categories || [],
  }
}

function buildFilter(q: string) {
  const term = q.trim()
  if (!term) return {}
  const re = new RegExp(escapeRegex(term), 'i')
  return {
    $or: [{ name: re }, { sku: re }, { brand: re }, { primaryCategory: re }],
  }
}

/** Newest first — uses default _id index (fast). Avoids slow updatedAt sort on 800+ docs. */
function listSort(q: string): Record<string, 1 | -1> {
  if (q.trim()) return { name: 1 }
  return { _id: -1 }
}

export async function listAdminProductsForGrid(
  db: Db,
  opts: { skip?: number; limit?: number; q?: string; includeTotal?: boolean },
): Promise<AdminProductGridResult> {
  const skip = Math.max(0, opts.skip ?? 0)
  const limit = Math.min(500, Math.max(20, opts.limit ?? ADMIN_PRODUCTS_PAGE_SIZE))
  const q = opts.q ?? ''
  const filter = buildFilter(q)
  const sort = listSort(q)

  const col = db.collection<ProductDoc>(COL.products)

  const [docs, total] = await Promise.all([
    col
      .find(filter, { projection: ADMIN_PRODUCT_MIN_PROJECTION })
      .sort(sort)
      .skip(skip)
      .limit(limit + 1)
      .maxTimeMS(12_000)
      .toArray(),
    opts.includeTotal && !q.trim()
      ? col.estimatedDocumentCount()
      : Promise.resolve(undefined),
  ])

  const hasMore = docs.length > limit
  const page = hasMore ? docs.slice(0, limit) : docs

  return {
    products: page.map(mapDoc),
    hasMore,
    limit,
    skip,
    total,
  }
}

const globalCache = globalThis as unknown as {
  vlAdminProductsCache?: Map<string, { at: number; data: AdminProductGridResult }>
}

const CACHE_TTL_MS = 20_000

export function getCachedAdminProducts(key: string): AdminProductGridResult | null {
  const map = globalCache.vlAdminProductsCache
  if (!map) return null
  const hit = map.get(key)
  if (!hit || Date.now() - hit.at > CACHE_TTL_MS) {
    map.delete(key)
    return null
  }
  return hit.data
}

export function setCachedAdminProducts(key: string, data: AdminProductGridResult): void {
  if (!globalCache.vlAdminProductsCache) {
    globalCache.vlAdminProductsCache = new Map()
  }
  globalCache.vlAdminProductsCache.set(key, { at: Date.now(), data })
  if (globalCache.vlAdminProductsCache.size > 24) {
    const oldest = globalCache.vlAdminProductsCache.keys().next().value
    if (oldest) globalCache.vlAdminProductsCache.delete(oldest)
  }
}

export function cacheKeyForGrid(skip: number, limit: number, q: string): string {
  return `${skip}:${limit}:${q.trim().toLowerCase()}`
}

export function clearAdminProductsCache(): void {
  globalCache.vlAdminProductsCache?.clear()
}
