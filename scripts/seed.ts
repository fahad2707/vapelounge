/**
 * Seed MongoDB from Wix export `catalog_products.csv` (products + variants + images).
 *
 *   npm run db:seed
 *
 * Requires MONGODB_URI in `.env.local`. Clears the `products` collection then inserts.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnvConfig } from '@next/env'
import { parse } from 'csv-parse/sync'
import { MongoClient } from 'mongodb'

import type { WixCsvRow } from '../lib/catalog/wix-import'
import { wixRowToProductDoc } from '../lib/catalog/wix-import'
import { COL } from '../lib/db/collections'

loadEnvConfig(process.cwd())

const BATCH = 200

async function main() {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    console.error('Missing MONGODB_URI. Add it to .env.local then retry.')
    process.exit(1)
  }

  const csvPath = join(process.cwd(), 'catalog_products.csv')
  const raw = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '')
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  }) as WixCsvRow[]

  const docs = []
  for (const row of rows) {
    if ((row.fieldType || '').trim() !== 'Product') continue
    const doc = wixRowToProductDoc(row)
    if (doc) docs.push(doc)
  }

  console.log(`Parsed ${docs.length} products from catalog_products.csv`)

  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'vapelounge'
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  const products = db.collection(COL.products)

  await products.deleteMany({})
  await products.dropIndexes().catch(() => {
    /* collection may not exist yet */
  })

  console.log(`Cleared "${COL.products}" and dropped legacy indexes`)

  for (let i = 0; i < docs.length; i += BATCH) {
    const chunk = docs.slice(i, i + BATCH)
    await products.insertMany(chunk, { ordered: false })
    console.log(`Inserted ${Math.min(i + BATCH, docs.length)} / ${docs.length}`)
  }

  await products.createIndex({ handleId: 1 }, { unique: true })
  await products.createIndex({ primaryCategory: 1 })
  await products.createIndex({ categories: 1 })
  await products.createIndex({ name: 1 })
  await products.createIndex({ visible: 1 })

  const orders = db.collection(COL.orders)
  await orders.createIndex({ createdAt: -1 })
  await orders.createIndex({ email: 1 })

  console.log(`Done. Database "${dbName}" now has ${docs.length} products.`)
  await client.close()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
