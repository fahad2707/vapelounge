import type { Db, Filter } from 'mongodb'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { slugify } from '@/lib/admin/slug'
import type { CategoryDoc, ProductDoc } from '@/lib/db/product-doc'
import { docToCatalogProductSummary } from '@/lib/db/product-doc'
import type { CatalogProduct } from '@/lib/catalog/types'
import {
  buildCategoryProductFilter,
  escapeRegex,
  PRODUCT_LIST_PROJECTION,
} from '@/lib/server/brand-filter'

export const MAX_FEATURED = 6
export const MAX_SHOP_DISPLAY = 10

const MATCH_VISIBLE = { $match: { visible: true } } as const

const ADD_SHOP_BRAND = {
  $addFields: {
    shopBrand: {
      $let: {
        vars: {
          bt: { $trim: { input: { $ifNull: ['$brand', ''] } } },
          pc: { $trim: { input: { $ifNull: ['$primaryCategory', ''] } } },
        },
        in: {
          $cond: [
            { $ne: ['$$bt', ''] },
            '$$bt',
            {
              $cond: [
                {
                  $and: [
                    { $ne: ['$$pc', ''] },
                    { $ne: [{ $toLower: '$$pc' }, 'uncategorized'] },
                  ],
                },
                '$$pc',
                'Other',
              ],
            },
          ],
        },
      },
    },
  },
} as const

/** Distinct brand/line labels used in the shop sidebar (from visible products). */
export async function distinctShopBrands(db: Db): Promise<string[]> {
  const rows = await db
    .collection<ProductDoc>(COL.products)
    .aggregate<{ _id: string }>(
      [MATCH_VISIBLE, { $project: { brand: 1, primaryCategory: 1 } }, ADD_SHOP_BRAND, { $group: { _id: '$shopBrand' } }],
      { allowDiskUse: true },
    )
    .toArray()
  return rows
    .map(r => r._id)
    .filter(Boolean)
    .sort((a, b) => {
      if (a === 'Other') return 1
      if (b === 'Other') return -1
      return a.localeCompare(b)
    })
}

/**
 * Ensure every catalogue line from products exists in `categories` (admin sync).
 * Call explicitly — not on every admin page load.
 */
export async function syncCategoriesFromProducts(db: Db): Promise<number> {
  const labels = await distinctShopBrands(db)
  const col = db.collection<CategoryDoc>(COL.categories)
  const now = new Date()
  let upserted = 0
  for (const name of labels) {
    const slug = slugify(name)
    const r = await col.updateOne(
      { slug },
      {
        $setOnInsert: {
          slug,
          name,
          image: null,
          featured: false,
          shopDisplay: false,
          shopDisplayOrder: 999,
          createdAt: now,
        },
        $set: { updatedAt: now },
      },
      { upsert: true },
    )
    if (r.upsertedCount) upserted++
  }
  return upserted
}

export function productFilterForCategory(catId: string, catName: string) {
  return buildCategoryProductFilter(catId, catName)
}

/** Batch product counts for admin category table (indexed count per category). */
export async function batchCategoryProductCounts(
  db: Db,
  categories: CategoryDoc[],
): Promise<Record<string, number>> {
  if (!categories.length) return {}

  const col = db.collection<ProductDoc>(COL.products)
  const pairs = await Promise.all(
    categories.map(async cat => {
      const id = (cat._id as ObjectId).toString()
      const n = await col.countDocuments(buildCategoryProductFilter(id, cat.name, cat.matchType))
      return [id, n] as const
    }),
  )
  return Object.fromEntries(pairs)
}

export async function countProductsForCategory(db: Db, catId: string, catName: string, matchType?: 'brand' | 'products'): Promise<number> {
  return db.collection<ProductDoc>(COL.products).countDocuments(buildCategoryProductFilter(catId, catName, matchType))
}

export interface ShopDisplayCategory {
  id: string
  slug: string
  name: string
  image: string | null
  products: CatalogProduct[]
}

export async function listShopDisplayCategories(db: Db): Promise<ShopDisplayCategory[]> {
  const cats = await db
    .collection<CategoryDoc>(COL.categories)
    .find({ shopDisplay: true })
    .sort({ shopDisplayOrder: 1, name: 1 })
    .limit(MAX_SHOP_DISPLAY)
    .toArray()

  if (!cats.length) return []

  const orFilters: Filter<ProductDoc>[] = cats.flatMap(c => {
    if (c.matchType === 'products') {
      return [{ categoryId: (c._id as ObjectId).toString() }, { categories: c.name }] as Filter<ProductDoc>[]
    }
    const re = new RegExp(`^${escapeRegex(c.name)}$`, 'i')
    return [{ brand: re }, { primaryCategory: re }, { categories: c.name }] as Filter<ProductDoc>[]
  })

  const allDocs = await db
    .collection<ProductDoc>(COL.products)
    .find({ visible: true, $or: orFilters }, { projection: PRODUCT_LIST_PROJECTION })
    .sort({ name: 1 })
    .toArray()

  const out: ShopDisplayCategory[] = []

  for (const c of cats) {
    const id = (c._id as ObjectId).toString()
    const nameLower = c.name.toLowerCase()
    const matched = allDocs.filter(p => {
      if (p.categoryId === id) return true
      if (c.matchType === 'products') {
        return Array.isArray(p.categories) && p.categories.some(x => (x || '').trim().toLowerCase() === nameLower)
      }
      if ((p.brand || '').trim().toLowerCase() === nameLower) return true
      if ((p.primaryCategory || '').trim().toLowerCase() === nameLower) return true
      return Array.isArray(p.categories) && p.categories.some(x => (x || '').trim().toLowerCase() === nameLower)
    })

    const slice = matched.slice(0, 24).map(docToCatalogProductSummary)
    if (slice.length === 0) continue

    out.push({
      id,
      slug: c.slug,
      name: c.name,
      image: c.image || null,
      products: slice,
    })
  }

  return out
}
