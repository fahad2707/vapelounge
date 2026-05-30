import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Cached MongoDB client for serverless (Vercel): reuses the connection promise
 * across invocations when possible.
 */
export function getMongoClientPromise(): Promise<MongoClient> | null {
  const uri = process.env.MONGODB_URI
  if (!uri?.trim()) return null

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 15_000,
      connectTimeoutMS: 15_000,
      socketTimeoutMS: 45_000,
      compressors: ['zlib'],
    })
    globalForMongo.mongoClientPromise = client.connect().catch(err => {
      globalForMongo.mongoClientPromise = undefined
      throw err
    })
  }
  return globalForMongo.mongoClientPromise
}

/** Connect with one retry after clearing a stale/failed pool (common on cold starts). */
export async function connectMongo(): Promise<MongoClient | null> {
  const first = getMongoClientPromise()
  if (!first) return null
  try {
    return await first
  } catch (err) {
    globalForMongo.mongoClientPromise = undefined
    await sleep(400)
    const second = getMongoClientPromise()
    if (!second) return null
    return second
  }
}

export function getDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || 'vapelounge'
}
