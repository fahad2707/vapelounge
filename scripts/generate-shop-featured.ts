/**
 * Writes the first 36 shop products (sorted by name) to data/shop-featured.json
 * for instant homepage shop grid. Re-run after major catalog changes:
 *
 *   npm run db:featured
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnvConfig } from '@next/env'
import { MongoClient } from 'mongodb'

import { COL } from '../lib/db/collections'
import {
  docToCatalogProductSummary,
  sanitizeCatalogImageUrl,
  type ProductDoc,
} from '../lib/db/product-doc'
import { SHOP_VISIBLE } from '../lib/server/brand-filter'
import { PRODUCT_LIST_PROJECTION } from '../lib/server/brand-filter'
import type { CatalogProduct } from '../lib/catalog/types'

loadEnvConfig(process.cwd())

const FEATURED_COUNT = 36

function deriveBrands(docs: Pick<ProductDoc, 'brand' | 'primaryCategory'>[]): string[] {
  const labels = new Set<string>()
  for (const p of docs) {
    const bt = (p.brand || '').trim()
    const pc = (p.primaryCategory || '').trim()
    if (bt) labels.add(bt)
    else if (pc && pc.toLowerCase() !== 'uncategorized') labels.add(pc)
    else labels.add('Other')
  }
  const sorted = [...labels].sort((a, b) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.localeCompare(b)
  })
  return ['All brands', ...sorted]
}

async function main() {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    console.error('Missing MONGODB_URI in .env.local')
    process.exit(1)
  }

  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'vapelounge'
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)

  const candidates = await db
    .collection<ProductDoc>(COL.products)
    .find(
      {
        ...SHOP_VISIBLE,
        image: { $regex: /^https?:\/\//i },
      },
      { projection: PRODUCT_LIST_PROJECTION },
    )
    .sort({ name: 1 })
    .limit(FEATURED_COUNT)
    .toArray()

  let docs = candidates
  if (docs.length < FEATURED_COUNT) {
    const more = await db
      .collection<ProductDoc>(COL.products)
      .find(SHOP_VISIBLE, { projection: PRODUCT_LIST_PROJECTION })
      .sort({ name: 1 })
      .limit(FEATURED_COUNT * 2)
      .toArray()
    const seen = new Set(docs.map(d => d.handleId))
    for (const d of more) {
      if (docs.length >= FEATURED_COUNT) break
      if (seen.has(d.handleId)) continue
      if (!sanitizeCatalogImageUrl(d.image)) continue
      seen.add(d.handleId)
      docs.push(d)
    }
  }

  await client.close()

  const products: CatalogProduct[] = docs.map(docToCatalogProductSummary)
  const brands = deriveBrands(docs)

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    products,
    brands,
  }

  const dir = join(process.cwd(), 'data')
  mkdirSync(dir, { recursive: true })
  const out = join(dir, 'shop-featured.json')
  writeFileSync(out, JSON.stringify(payload), 'utf8')
  console.log(`Wrote ${products.length} featured products → ${out}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
