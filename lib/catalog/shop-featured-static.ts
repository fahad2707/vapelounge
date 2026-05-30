import type { CatalogProduct } from '@/lib/catalog/types'
import featuredJson from '@/data/shop-featured.json'

export const SHOP_FEATURED_COUNT = 36

export interface ShopFeaturedPayload {
  version: number
  generatedAt: string
  products: CatalogProduct[]
  brands: string[]
}

const payload = featuredJson as ShopFeaturedPayload

/** Bundled top-36 products — instant shop first paint (no API wait). */
export const SHOP_FEATURED_PRODUCTS: CatalogProduct[] = payload.products ?? []

export const SHOP_FEATURED_BRANDS: string[] =
  payload.brands?.length ? payload.brands : ['All brands']

export function mergeCatalogWithFeatured(
  featured: CatalogProduct[],
  rest: CatalogProduct[],
): CatalogProduct[] {
  if (!rest.length) return featured
  const ids = new Set(featured.map(p => p.id))
  const extra = rest.filter(p => !ids.has(p.id))
  return [...featured, ...extra]
}
