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
export function buildCategoryProductFilter(catId: string, catName: string): Filter<ProductDoc> {
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
  image: 1,
  primaryCategory: 1,
  categories: 1,
  price: 1,
  compareAtPrice: 1,
  badge: 1,
  inStock: 1,
  sku: 1,
  brand: 1,
  accentColor: 1,
} as const

export const ADMIN_PRODUCT_LIST_PROJECTION = {
  handleId: 1,
  name: 1,
  image: 1,
  primaryCategory: 1,
  price: 1,
  inStock: 1,
  sku: 1,
  brand: 1,
  visible: 1,
  categoryId: 1,
  modelId: 1,
  updatedAt: 1,
} as const
