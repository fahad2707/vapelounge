import { MongoClient } from 'mongodb'
import { loadEnvConfig } from '@next/env'
import { COL } from '../lib/db/collections'

loadEnvConfig(process.cwd())

async function main() {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    console.error('Missing MONGODB_URI in environment')
    process.exit(1)
  }

  console.log('Connecting to MongoDB...')
  const client = new MongoClient(uri)
  await client.connect()
  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'vapelounge'
  console.log('Connected. Database:', dbName)
  const db = client.db(dbName)

  const products = db.collection(COL.products)
  const total = await products.countDocuments()
  console.log('Total products in database:', total)

  // Server-side queries to avoid downloading base64 data
  const base64Count = await products.countDocuments({ image: { $regex: '^data:' } })
  const cloudinaryCount = await products.countDocuments({ image: { $regex: 'cloudinary\\.com' } })
  const wixCount = await products.countDocuments({ image: { $regex: 'wixstatic\\.com' } })
  const emptyCount = await products.countDocuments({ $or: [{ image: null }, { image: '' }] })
  
  const totalCategorized = base64Count + cloudinaryCount + wixCount + emptyCount
  const otherCount = total - totalCategorized

  console.log('\nImage Type Breakdown (Server-side Count):')
  console.log(`- Base64: ${base64Count}`)
  console.log(`- Cloudinary: ${cloudinaryCount}`)
  console.log(`- Wix: ${wixCount}`)
  console.log(`- Empty: ${emptyCount}`)
  console.log(`- Other: ${otherCount}`)

  // Get a sample of client added products (defined as not having 'product-' or '-wix-' in handleId)
  const clientAddedCount = await products.countDocuments({
    handleId: { $not: { $regex: '^product-|-wix-' } }
  })
  console.log(`\nPossible client-added products count: ${clientAddedCount}`)

  const sampleClientAdded = await products
    .find({ handleId: { $not: { $regex: '^product-|-wix-' } } }, { projection: { name: 1, handleId: 1, image: { $substrCP: ["$image", 0, 50] } } })
    .limit(5)
    .toArray()
  
  console.log('Sample client-added products (showing first 50 chars of image):')
  console.log(sampleClientAdded)

  await client.close()
}

main().catch(console.error)
