import { getDb } from '@/lib/db/get-db'
import { COL } from '@/lib/db/collections'
import { docToCatalogProduct, docToCatalogProductSummary, type ProductDoc } from '@/lib/db/product-doc'

/** Match visible products (first stage of shop pipelines). */
const MATCH_VISIBLE = { $match: { visible: true } } as const

/**
 * Wix CSV often leaves `brand` empty. Use trimmed brand when set; otherwise fall back
 * to `primaryCategory` (first collection segment) so filters show STLTH, Elf Bar, etc.
 */
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

/** Keep only card fields before sort/group so Mongo stays under the 32 MB sort cap. */
const PROJECT_SLIM = {
  $project: {
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
} as const

const PROJECT_DROP_SHOP_BRAND = { $project: { shopBrand: 0 } } as const

const AGG_OPTS = { allowDiskUse: true } as const

export async function listProducts(params: { brand?: string | null; limit: number; skip: number }) {
  const db = await getDb()
  if (!db) return null

  const col = db.collection<ProductDoc>(COL.products)

  const b = params.brand?.trim()
  const brandStages: object[] = [MATCH_VISIBLE, PROJECT_SLIM, ADD_SHOP_BRAND]
  if (b && b !== 'All brands') {
    brandStages.push({ $match: { shopBrand: b } })
  }

  const listPipeline = [
    ...brandStages,
    { $sort: { name: 1 } as const },
    { $skip: params.skip },
    { $limit: params.limit },
    PROJECT_DROP_SHOP_BRAND,
  ]

  const countPipeline = [...brandStages, { $count: 'n' }]

  const brandsPipeline = [
    MATCH_VISIBLE,
    PROJECT_SLIM,
    ADD_SHOP_BRAND,
    { $group: { _id: '$shopBrand' } },
    { $sort: { _id: 1 } },
  ]

  const [docs, countRows, brandAgg] = await Promise.all([
    col.aggregate<ProductDoc>(listPipeline, AGG_OPTS).toArray(),
    col.aggregate<{ n: number }>(countPipeline, AGG_OPTS).toArray(),
    col.aggregate<{ _id: string }>(brandsPipeline, AGG_OPTS).toArray(),
  ])

  const total = countRows[0]?.n ?? 0

  const labels = brandAgg.map(x => x._id as string).sort((a, c) => {
    if (a === 'Other') return 1
    if (c === 'Other') return -1
    return a.localeCompare(c)
  })
  const brands = ['All brands', ...labels]

  return {
    products: docs.map(docToCatalogProductSummary),
    total,
    brands,
  }
}

export async function getProductByHandleId(handleId: string) {
  const db = await getDb()
  if (!db) return null
  const col = db.collection<ProductDoc>(COL.products)
  const doc = await col.findOne({ handleId, visible: true })
  return doc ? docToCatalogProduct(doc) : null
}

/** Returns siblings (other visible products in the same variant group). */
export async function getSiblingsForHandleId(handleId: string) {
  const db = await getDb()
  if (!db) return []
  const col = db.collection<ProductDoc>(COL.products)
  const me = await col.findOne({ handleId, visible: true })
  if (!me?.variantGroupId) return []
  const siblings = await col
    .find(
      { variantGroupId: me.variantGroupId, handleId: { $ne: handleId }, visible: true },
      { projection: { handleId: 1, name: 1, image: 1 } },
    )
    .limit(24)
    .toArray()
  return siblings.map(s => {
    const flavourLabel = inferFlavourLabel(s.name, me.name)
    return {
      id: s.handleId,
      name: s.name,
      image: s.image || '',
      flavourLabel,
    }
  })
}

/**
 * Best-effort: derive the part of a sibling's name that differs from the
 * "shared" product family name. e.g. given
 *   me   = "Elf Bar BC5000 Watermelon"
 *   sib  = "Elf Bar BC5000 Guava"
 * returns "Guava". Falls back to the full name if no shared prefix is found.
 */
function inferFlavourLabel(siblingName: string, myName: string): string {
  const a = siblingName.trim()
  const b = myName.trim()
  if (!a || !b) return a || ''
  const aWords = a.split(/\s+/)
  const bWords = b.split(/\s+/)
  let i = 0
  while (i < aWords.length && i < bWords.length && aWords[i].toLowerCase() === bWords[i].toLowerCase()) {
    i++
  }
  const tail = aWords.slice(i).join(' ').trim()
  return tail || a
}
