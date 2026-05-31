import { pickProductListImage } from '@/lib/db/product-doc'
import type { CatalogProduct } from '@/lib/catalog/types'

/** Resolved thumbnail for shop cards (list API + client fallback). */
export function productCardImage(p: Pick<CatalogProduct, 'image' | 'images'>): string {
  return pickProductListImage({ image: p.image, images: p.images })
}
