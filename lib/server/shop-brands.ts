import type { Db } from 'mongodb'
import { getDb } from '@/lib/db/get-db'
import { COL } from '@/lib/db/collections'
import type { ProductDoc } from '@/lib/db/product-doc'
import { SHOP_VISIBLE } from '@/lib/server/brand-filter'

async function loadShopBrandsFromDb(db: Db): Promise<string[]> {
  const rows = await db
    .collection<ProductDoc>(COL.products)
    .aggregate<{ _id: string }>(
      [
        { $match: SHOP_VISIBLE },
        { $project: { brand: 1, primaryCategory: 1 } },
        {
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
        },
        { $group: { _id: '$shopBrand' } },
      ],
      { allowDiskUse: true, maxTimeMS: 20_000 },
    )
    .toArray()

  const sorted = rows
    .map(r => r._id)
    .filter(Boolean)
    .sort((a, b) => {
      if (a === 'Other') return 1
      if (b === 'Other') return -1
      return a.localeCompare(b)
    })
  return ['All brands', ...sorted]
}

const globalBrands = globalThis as unknown as {
  vlBrands?: { list: string[]; at: number }
}

const BRANDS_TTL_MS = 300_000

/** Sidebar brand list — cached in memory; does not load the full product catalog. */
export async function getShopBrands(): Promise<string[]> {
  const now = Date.now()
  const hit = globalBrands.vlBrands
  if (hit && hit.list.length > 1 && now - hit.at < BRANDS_TTL_MS) {
    return hit.list
  }

  const db = await getDb()
  if (!db) return ['All brands']

  const list = await loadShopBrandsFromDb(db)
  if (list.length > 1) {
    globalBrands.vlBrands = { list, at: now }
  }
  return list
}

export function clearShopBrandsCache(): void {
  delete globalBrands.vlBrands
}
