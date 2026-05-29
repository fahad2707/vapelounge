import type { CatalogProduct } from '@/lib/catalog/types'

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
