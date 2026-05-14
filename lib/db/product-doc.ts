import type { ObjectId } from 'mongodb'
import type { CatalogProduct, CatalogVariant } from '@/lib/catalog/types'

/** MongoDB product document. */
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

  /** Admin-managed fields (added with the admin panel). */
  costPrice?: number | null
  quantity?: number | null
  categoryId?: string | null
  modelId?: string | null
  variantGroupId?: string | null

  createdAt?: Date
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

/** Category doc — top-level brand line (STLTH, Elfbar, Oxybar). */
export interface CategoryDoc {
  _id?: ObjectId
  slug: string
  name: string
  /** Optional hero image for the homepage rotating carousel. */
  image?: string | null
  /** When true, shown on the public homepage rotating wheel (cap at 6). */
  featured?: boolean
  createdAt?: Date
  updatedAt?: Date
}

/** Model doc — sub-line under a category (e.g. Elfbar BC5000, STLTH Pro). */
export interface ModelDoc {
  _id?: ObjectId
  slug: string
  name: string
  categoryId: string
  createdAt?: Date
  updatedAt?: Date
}

/** Variant group — clubs sibling products (flavours of the same model) together. */
export interface VariantGroupDoc {
  _id?: ObjectId
  name: string
  productHandleIds: string[]
  createdAt?: Date
  updatedAt?: Date
}
