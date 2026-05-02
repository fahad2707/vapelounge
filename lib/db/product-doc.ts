import type { CatalogProduct, CatalogVariant } from '@/lib/catalog/types'

/** MongoDB product document (Wix catalog seed). */
export interface ProductDoc {
  handleId: string
  name: string
  descriptionHtml: string
  descriptionPlain: string
  images: string[]
  image: string
  primaryCategory: string
  categories: string[]
  price: number
  compareAtPrice: number | null
  badge: string | null
  inStock: boolean
  variants: CatalogVariant[]
  sku: string | null
  brand: string | null
  collectionRaw: string
  visible: boolean
  accentColor: string
  updatedAt?: Date
}

export function docToCatalogProduct(doc: ProductDoc): CatalogProduct {
  return {
    id: doc.handleId,
    name: doc.name,
    descriptionHtml: doc.descriptionHtml,
    descriptionPlain: doc.descriptionPlain,
    images: doc.images,
    image: doc.image,
    primaryCategory: doc.primaryCategory,
    categories: doc.categories,
    price: doc.price,
    compareAtPrice: doc.compareAtPrice,
    badge: doc.badge,
    inStock: doc.inStock,
    variants: doc.variants,
    sku: doc.sku,
    brand: doc.brand,
    accentColor: doc.accentColor,
  }
}
