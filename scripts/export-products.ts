/**
 * Export all products from MongoDB to JSON and CSV.
 *
 *   npm run db:export
 *
 * Requires MONGODB_URI in `.env.local`. Writes to `exports/` in the project root.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnvConfig } from '@next/env'
import { MongoClient } from 'mongodb'

import { COL } from '../lib/db/collections'
import type { ProductDoc } from '../lib/db/product-doc'

loadEnvConfig(process.cwd())

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

async function main() {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    console.error('Missing MONGODB_URI. Add it to .env.local then retry.')
    process.exit(1)
  }

  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'vapelounge'
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  const docs = await db.collection<ProductDoc>(COL.products).find({}).sort({ name: 1 }).toArray()
  await client.close()

  const outDir = join(process.cwd(), 'exports')
  mkdirSync(outDir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 10)
  const jsonPath = join(outDir, `products-${stamp}.json`)
  const csvPath = join(outDir, `products-${stamp}.csv`)

  writeFileSync(jsonPath, JSON.stringify(docs, null, 2), 'utf8')

  const headers = [
    'id',
    'name',
    'brand',
    'primaryCategory',
    'price',
    'inStock',
    'visible',
    'badge',
    'image',
  ] as const
  const rows = docs.map(d => [
    d._id?.toString() ?? d.handleId ?? '',
    d.name ?? '',
    d.brand ?? '',
    d.primaryCategory ?? '',
    d.price ?? '',
    d.inStock ?? '',
    d.visible ?? '',
    d.badge ?? '',
    d.image ?? '',
  ])
  const csv = [headers.join(','), ...rows.map(r => r.map(csvEscape).join(','))].join('\n')
  writeFileSync(csvPath, csv, 'utf8')

  console.log(`Exported ${docs.length} products:`)
  console.log(`  ${jsonPath}`)
  console.log(`  ${csvPath}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
