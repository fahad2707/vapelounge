import { getDb } from '@/lib/db/get-db'
import { COL } from '@/lib/db/collections'
import { docToCatalogProduct, docToCatalogProductSummary, type ProductDoc } from '@/lib/db/product-doc'
import { buildVisibleBrandFilter, PRODUCT_LIST_PROJECTION } from '@/lib/server/brand-filter'
import { getShopBrands } from '@/lib/server/shop-brands'

export async function listProducts(params: {
  brand?: string | null
  limit: number
  skip: number
  includeBrands?: boolean
}) {
  const db = await getDb()
  if (!db) return null

  const col = db.collection<ProductDoc>(COL.products)
  const filter = buildVisibleBrandFilter(params.brand)

  const limit = params.limit
  const docs = await col
    .find(filter, { projection: PRODUCT_LIST_PROJECTION })
    .sort({ name: 1 })
    .skip(params.skip)
    .limit(limit + 1)
    .maxTimeMS(25_000)
    .toArray()

  const hasMore = docs.length > limit
  const page = hasMore ? docs.slice(0, limit) : docs

  const brands =
    params.includeBrands !== false && params.skip === 0 ? await getShopBrands() : null

  return {
    products: page.map(docToCatalogProductSummary),
    total: hasMore ? params.skip + limit + 1 : params.skip + page.length,
    hasMore,
    brands: brands ?? undefined,
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
