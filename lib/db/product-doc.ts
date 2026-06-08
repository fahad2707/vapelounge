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
  const image = pickProductListImage(doc) || doc.image || ''
  const images = doc.images?.length ? doc.images : image ? [image] : []
  return {
    id: doc.handleId,
    name: doc.name,
    descriptionHtml: doc.descriptionHtml,
    descriptionPlain: doc.descriptionPlain,
    images,
    image,
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

/** Strip embedded data-URIs — they bloat API responses and break CDN caching. */
export function sanitizeCatalogImageUrl(url: string | null | undefined): string {
  const u = url?.trim() ?? ''
  if (!u || u.startsWith('data:')) return ''
  if (u.startsWith('https://') || u.startsWith('http://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return ''
}

/**
 * Primary image for shop cards and list APIs.
 * Prefers CDN/http URLs; falls back to data URLs when admin uploads lack Cloudinary.
 */
export function pickProductListImage(doc: Pick<ProductDoc, 'image' | 'images'>): string {
  const candidates: string[] = []
  const primary = doc.image?.trim()
  if (primary) candidates.push(primary)
  if (Array.isArray(doc.images)) {
    for (const u of doc.images) {
      const t = u?.trim()
      if (t && !candidates.includes(t)) candidates.push(t)
    }
  }
  for (const raw of candidates) {
    const http = sanitizeCatalogImageUrl(raw)
    if (http) return http
  }
  for (const raw of candidates) {
    if (raw.startsWith('data:image/')) return raw
  }
  return ''
}

/** Lightweight shape for shop grid / list API (omits HTML, galleries, variants). */
export function docToCatalogProductSummary(doc: ProductDoc): CatalogProduct {
  const image = pickProductListImage(doc)
  return {
    id: doc.handleId,
    name: doc.name,
    descriptionHtml: '',
    descriptionPlain: '',
    images: image ? [image] : [],
    image,
    primaryCategory: doc.primaryCategory,
    categories: doc.categories,
    price: doc.price,
    compareAtPrice: doc.compareAtPrice,
    badge: doc.badge,
    inStock: doc.inStock,
    variants: [],
    sku: doc.sku,
    brand: doc.brand,
    accentColor: doc.accentColor,
    categoryId: doc.categoryId ?? null,
    modelId: doc.modelId ?? null,
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
  /** When true, shown in shop “category rails” after all products load (cap at 10). */
  shopDisplay?: boolean
  /** Lower numbers appear first in shop rails. */
  shopDisplayOrder?: number
  /** Parent header page (Disposable, E-liquids) for site navigation. */
  headerPageId?: string | null
  /** Order within the header page dropdown (lower = earlier). */
  navOrder?: number
  /** Type of matching for products: 'brand' matches brand/primaryCategory name, 'products' matches exact products. */
  matchType?: 'brand' | 'products'
  createdAt?: Date
  updatedAt?: Date
}

/** Top-level site header tab (e.g. Disposable Vapes, E-liquids). */
export interface HeaderPageDoc {
  _id?: ObjectId
  slug: string
  name: string
  showInNav?: boolean
  navOrder?: number
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
