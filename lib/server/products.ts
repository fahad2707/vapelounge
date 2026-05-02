import { getMongoClientPromise, getDbName } from '@/lib/mongodb'
import { COL } from '@/lib/db/collections'
import { docToCatalogProduct, type ProductDoc } from '@/lib/db/product-doc'

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

const PROJECT_DROP_SHOP_BRAND = { $project: { shopBrand: 0 } } as const

export async function listProducts(params: { brand?: string | null; limit: number; skip: number }) {
  const promise = getMongoClientPromise()
  if (!promise) return null

  const client = await promise
  const col = client.db(getDbName()).collection<ProductDoc>(COL.products)

  const b = params.brand?.trim()
  const brandStages: object[] = [MATCH_VISIBLE, ADD_SHOP_BRAND]
  if (b && b !== 'All brands') {
    if (b === 'Other') {
      brandStages.push({ $match: { shopBrand: 'Other' } })
    } else {
      brandStages.push({ $match: { shopBrand: b } })
    }
  }

  const listPipeline = [
    ...brandStages,
    { $sort: { name: 1 } as const },
    { $skip: params.skip },
    { $limit: params.limit },
    PROJECT_DROP_SHOP_BRAND,
  ]

  const countPipeline = [...brandStages, { $count: 'n' }]

  const brandsPipeline = [MATCH_VISIBLE, ADD_SHOP_BRAND, { $group: { _id: '$shopBrand' } }, { $sort: { _id: 1 } }]

  const [docs, countRows, brandAgg] = await Promise.all([
    col.aggregate<ProductDoc>(listPipeline).toArray(),
    col.aggregate<{ n: number }>(countPipeline).toArray(),
    col.aggregate<{ _id: string }>(brandsPipeline).toArray(),
  ])

  const total = countRows[0]?.n ?? 0

  const labels = brandAgg.map(x => x._id as string).sort((a, c) => {
    if (a === 'Other') return 1
    if (c === 'Other') return -1
    return a.localeCompare(c)
  })
  const brands = ['All brands', ...labels]

  return {
    products: docs.map(docToCatalogProduct),
    total,
    brands,
  }
}

export async function getProductByHandleId(handleId: string) {
  const promise = getMongoClientPromise()
  if (!promise) return null
  const client = await promise
  const col = client.db(getDbName()).collection<ProductDoc>(COL.products)
  const doc = await col.findOne({ handleId })
  return doc ? docToCatalogProduct(doc) : null
}
