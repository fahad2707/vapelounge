import type { Filter } from 'mongodb'
import type { ProductDoc } from '@/lib/db/product-doc'

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Match shop-visible products (field missing on old imports = visible). */
export const SHOP_VISIBLE = { visible: { $ne: false } } as const

/** Fast Mongo filter for visible products, optionally by sidebar brand/line. */
export function buildVisibleBrandFilter(brand: string | null | undefined): Filter<ProductDoc> {
  const b = brand?.trim()
  if (!b || b === 'All brands') return { ...SHOP_VISIBLE }

  if (b === 'Other') {
    return {
      ...SHOP_VISIBLE,
      $and: [
        {
          $or: [{ brand: null }, { brand: '' }, { brand: { $exists: false } }],
        },
        {
          $or: [
            { primaryCategory: null },
            { primaryCategory: '' },
            { primaryCategory: { $exists: false } },
            { primaryCategory: /^uncategorized$/i },
          ],
        },
      ],
    } as Filter<ProductDoc>
  }

  const re = new RegExp(`^${escapeRegex(b)}$`, 'i')
  return {
    ...SHOP_VISIBLE,
    $or: [{ brand: re }, { primaryCategory: re }, { categories: b }],
  }
}

/** Match products for an admin category name (case-insensitive). */
export function buildCategoryProductFilter(
  catId: string,
  catName: string,
  matchType?: 'brand' | 'products',
): Filter<ProductDoc> {
  if (matchType === 'products') {
    return {
      ...SHOP_VISIBLE,
      $or: [
        { categoryId: catId },
        { categories: catName },
      ],
    }
  }

  const re = new RegExp(`^${escapeRegex(catName.trim())}$`, 'i')
  return {
    ...SHOP_VISIBLE,
    $or: [
      { categoryId: catId },
      { brand: re },
      { primaryCategory: re },
      { categories: catName },
    ],
  }
}

export const PRODUCT_LIST_PROJECTION = {
  handleId: 1,
  name: 1,
  image: {
    $cond: {
      if: { $eq: [{ $substrCP: [{ $ifNull: ["$image", ""] }, 0, 5] }, "data:"] },
      then: "",
      else: "$image"
    }
  },
  images: {
    $cond: {
      if: { $eq: [{ $substrCP: [{ $ifNull: ["$image", ""] }, 0, 5] }, "data:"] },
      then: [],
      else: "$images"
    }
  },
  primaryCategory: 1,
  categories: 1,
  price: 1,
  compareAtPrice: 1,
  badge: 1,
  inStock: 1,
  sku: 1,
  brand: 1,
  accentColor: 1,
  categoryId: 1,
  modelId: 1,
} as any

/** Admin product grid — no descriptions (loaded on edit via GET /api/admin/products/:id). */
export const ADMIN_PRODUCT_GRID_PROJECTION = {
  handleId: 1,
  name: 1,
  image: {
    $cond: {
      if: { $eq: [{ $substrCP: [{ $ifNull: ["$image", ""] }, 0, 5] }, "data:"] },
      then: "",
      else: "$image"
    }
  },
  images: {
    $cond: {
      if: { $eq: [{ $substrCP: [{ $ifNull: ["$image", ""] }, 0, 5] }, "data:"] },
      then: [],
      else: "$images"
    }
  },
  primaryCategory: 1,
  price: 1,
  compareAtPrice: 1,
  costPrice: 1,
  quantity: 1,
  inStock: 1,
  sku: 1,
  brand: 1,
  visible: 1,
  categoryId: 1,
  modelId: 1,
} as any

export const ADMIN_PRODUCT_DETAIL_PROJECTION = {
  handleId: 1,
  name: 1,
  image: 1,
  images: 1,
  primaryCategory: 1,
  price: 1,
  compareAtPrice: 1,
  costPrice: 1,
  quantity: 1,
  inStock: 1,
  sku: 1,
  brand: 1,
  visible: 1,
  categoryId: 1,
  modelId: 1,
  descriptionPlain: 1,
  descriptionHtml: 1,
} as const

/** @deprecated Use ADMIN_PRODUCT_GRID_PROJECTION for lists. */
export const ADMIN_PRODUCT_LIST_PROJECTION = ADMIN_PRODUCT_DETAIL_PROJECTION
