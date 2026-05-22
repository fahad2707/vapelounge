import type { Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { slugify } from '@/lib/admin/slug'
import type { CategoryDoc, ProductDoc } from '@/lib/db/product-doc'
import { docToCatalogProductSummary } from '@/lib/db/product-doc'
import type { CatalogProduct } from '@/lib/catalog/types'

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
 * Ensure every catalog line from products exists in `categories` so admin can
 * manage featured / shop showcase without duplicates.
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
  return {
    visible: true,
    $or: [
      { categoryId: catId },
      { primaryCategory: catName },
      { brand: catName },
      { categories: catName },
    ],
  }
}

export async function countProductsForCategory(db: Db, catId: string, catName: string): Promise<number> {
  return db.collection<ProductDoc>(COL.products).countDocuments(productFilterForCategory(catId, catName))
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

  const col = db.collection<ProductDoc>(COL.products)
  const out: ShopDisplayCategory[] = []

  for (const c of cats) {
    const id = (c._id as ObjectId).toString()
    const docs = await col
      .find(productFilterForCategory(id, c.name), {
        projection: {
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
        },
      })
      .sort({ name: 1 })
      .limit(24)
      .toArray()
    if (docs.length === 0) continue
    out.push({
      id,
      slug: c.slug,
      name: c.name,
      image: c.image || null,
      products: docs.map(docToCatalogProductSummary),
    })
  }
  return out
}
