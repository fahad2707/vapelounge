import { MongoClient, ObjectId } from 'mongodb'
import { loadEnvConfig } from '@next/env'
import { COL } from '../lib/db/collections'

loadEnvConfig(process.cwd())

const MONGODB_URI = process.env.MONGODB_URI?.trim() || ""
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim() || ""
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || ""

async function uploadToCloudinary(base64Data: string, productName: string): Promise<string> {
  const upstream = new FormData()
  upstream.append('file', base64Data)
  upstream.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: upstream,
  })

  if (!r.ok) {
    const j = await r.json().catch(() => ({})) as any
    throw new Error(j.error?.message || `Cloudinary returned status ${r.status}`)
  }

  const j = await r.json() as any
  if (!j.secure_url) {
    throw new Error('Cloudinary response missing secure_url')
  }

  return j.secure_url
}

async function main() {
  console.log('Connecting to MongoDB...')
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('vapelounge')
  const productsCol = db.collection(COL.products)

  console.log('Starting high-performance batched migration...')
  
  let successCount = 0
  let failCount = 0
  let processedCount = 0
  const failedIds: ObjectId[] = []

  while (true) {
    // Query products that have base64 in image or images, excluding failed ones
    const query = {
      _id: { $nin: failedIds },
      $or: [
        { image: { $gte: 'data:', $lt: 'datb' } },
        { images: { $gte: 'data:', $lt: 'datb' } }
      ]
    }

    // Load only 10 products per batch
    const batch = await productsCol.find(query).limit(10).toArray()
    if (batch.length === 0) {
      break
    }

    console.log(`\n--- Processing batch of ${batch.length} products (Processed: ${processedCount}) ---`)

    // Process the batch concurrently (up to 10 at a time)
    const promises = batch.map(async (p) => {
      const index = ++processedCount
      console.log(`[${index}] Starting product: "${p.name}" (ID: ${p.handleId})`)

      try {
        let updatedImage = p.image || ''
        let updatedImages = Array.isArray(p.images) ? [...p.images] : []
        let needsUpdate = false

        // 1. Primary image
        if (typeof p.image === 'string' && p.image.startsWith('data:')) {
          console.log(`  - [${p.handleId}] Uploading primary image...`)
          const cloudinaryUrl = await uploadToCloudinary(p.image, p.name)
          updatedImage = cloudinaryUrl
          needsUpdate = true
          console.log(`  - [${p.handleId}] Primary image done: ${cloudinaryUrl}`)
        }

        // 2. Gallery images
        if (Array.isArray(p.images)) {
          for (let i = 0; i < p.images.length; i++) {
            const imgUrl = p.images[i]
            if (typeof imgUrl === 'string' && imgUrl.startsWith('data:')) {
              console.log(`  - [${p.handleId}] Uploading gallery image ${i + 1}/${p.images.length}...`)
              const cloudinaryUrl = await uploadToCloudinary(imgUrl, p.name)
              updatedImages[i] = cloudinaryUrl
              needsUpdate = true
              console.log(`  - [${p.handleId}] Gallery image ${i + 1} done: ${cloudinaryUrl}`)
            }
          }
        }

        // 3. Save to database
        if (needsUpdate) {
          if (updatedImage && (!updatedImages.length || updatedImages[0] === '')) {
            updatedImages = [updatedImage]
          }
          await productsCol.updateOne(
            { _id: p._id },
            {
              $set: {
                image: updatedImage,
                images: updatedImages,
                updatedAt: new Date()
              }
            }
          )
          successCount++
          console.log(`[${index}] ✅ Successfully migrated: "${p.name}"`)
        } else {
          console.log(`[${index}] ℹ️ No base64 fields to update: "${p.name}"`)
        }
      } catch (err) {
        failCount++
        failedIds.push(p._id)
        console.error(`[${index}] ❌ Failed to migrate: "${p.name}". Error:`, err instanceof Error ? err.message : err)
      }
    })

    await Promise.all(promises)
  }

  console.log('\n=====================================')
  console.log('Migration Complete!')
  console.log(`- Successfully migrated: ${successCount}`)
  console.log(`- Failed/Skipped: ${failCount}`)
  console.log('=====================================')

  await client.close()
}

main().catch(console.error)
