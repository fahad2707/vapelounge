import type { CatalogProduct } from '@/lib/catalog/types'

export interface ShopNavFilter {
  categoryId?: string
  modelId?: string
  headerPageId?: string
  categoryIds?: string[]
  label?: string
}

/** Filter by admin header page / category / model (from header nav). */
export function productMatchesNav(p: CatalogProduct, nav: ShopNavFilter | null): boolean {
  if (!nav) return true
  if (nav.modelId) return p.modelId === nav.modelId
  if (nav.categoryId) return p.categoryId === nav.categoryId
  if (nav.categoryIds?.length) {
    return Boolean(p.categoryId && nav.categoryIds.includes(p.categoryId))
  }
  return true
}

/** Client-safe brand filter (matches server logic). */
export function productMatchesBrand(p: CatalogProduct, brand: string): boolean {
  if (!brand || brand === 'All brands') return true
  if (brand === 'Other') {
    const bt = (p.brand || '').trim()
    const pc = (p.primaryCategory || '').trim()
    return !bt && (!pc || pc.toLowerCase() === 'uncategorized')
  }
  const b = brand.toLowerCase()
  if ((p.brand || '').trim().toLowerCase() === b) return true
  if ((p.primaryCategory || '').trim().toLowerCase() === b) return true
  return p.categories.some(c => (c || '').trim().toLowerCase() === b)
}
