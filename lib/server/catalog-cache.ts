import { getDb } from '@/lib/db/get-db'
import { COL } from '@/lib/db/collections'
import { docToCatalogProductSummary, type ProductDoc } from '@/lib/db/product-doc'
import { PRODUCT_LIST_PROJECTION } from '@/lib/server/brand-filter'
import type { CatalogProduct } from '@/lib/catalog/types'

export const CATALOG_CACHE_TAG = 'vapelounge-catalog'

import { SHOP_VISIBLE as SHOP_VISIBLE_FILTER } from '@/lib/server/brand-filter'

export { SHOP_VISIBLE_FILTER }

export interface CachedCatalog {
  products: CatalogProduct[]
  brands: string[]
  total: number
  cachedAt: number
}

function deriveBrands(docs: Pick<ProductDoc, 'brand' | 'primaryCategory'>[]): string[] {
  const labels = new Set<string>()
  for (const p of docs) {
    const bt = (p.brand || '').trim()
    const pc = (p.primaryCategory || '').trim()
    if (bt) labels.add(bt)
    else if (pc && pc.toLowerCase() !== 'uncategorized') labels.add(pc)
    else labels.add('Other')
  }
  const sorted = [...labels].sort((a, b) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.localeCompare(b)
  })
  return ['All brands', ...sorted]
}

async function loadCatalogFromDb(): Promise<CachedCatalog> {
  const db = await getDb()
  if (!db) {
    return { products: [], brands: ['All brands'], total: 0, cachedAt: Date.now() }
  }

  const docs = await db
    .collection<ProductDoc>(COL.products)
    .find(SHOP_VISIBLE_FILTER, { projection: PRODUCT_LIST_PROJECTION })
    .sort({ name: 1 })
    .maxTimeMS(25_000)
    .toArray()

  const products = docs.map(docToCatalogProductSummary)
  return {
    products,
    brands: deriveBrands(docs),
    total: products.length,
    cachedAt: Date.now(),
  }
}

/** In-memory TTL cache (never cache empty — avoids build-time poisoned unstable_cache). */
const globalCache = globalThis as unknown as {
  vlCatalog?: { data: CachedCatalog; at: number }
}

const TTL_MS = 120_000

export async function getCachedCatalog(): Promise<CachedCatalog> {
  const now = Date.now()
  const hit = globalCache.vlCatalog
  if (hit && hit.data.total > 0 && now - hit.at < TTL_MS) {
    return hit.data
  }

  const data = await loadCatalogFromDb()
  if (data.total > 0) {
    globalCache.vlCatalog = { data, at: now }
  }
  return data
}
