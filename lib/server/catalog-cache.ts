import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/db/get-db'
import { COL } from '@/lib/db/collections'
import { docToCatalogProductSummary, type ProductDoc } from '@/lib/db/product-doc'
import { PRODUCT_LIST_PROJECTION } from '@/lib/server/brand-filter'
import type { CatalogProduct } from '@/lib/catalog/types'

export const CATALOG_CACHE_TAG = 'vapelounge-catalog'

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
    .find({ visible: true }, { projection: PRODUCT_LIST_PROJECTION })
    .sort({ name: 1 })
    .toArray()

  const products = docs.map(docToCatalogProductSummary)
  return {
    products,
    brands: deriveBrands(docs),
    total: products.length,
    cachedAt: Date.now(),
  }
}

/** One Mongo query per ~2 min per region — all shop visitors share this. */
export const getCachedCatalog = unstable_cache(loadCatalogFromDb, ['vapelounge-catalog-v3'], {
  revalidate: 120,
  tags: [CATALOG_CACHE_TAG],
})
