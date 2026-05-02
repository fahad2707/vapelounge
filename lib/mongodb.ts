import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>
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
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 10_000,
    })
    globalForMongo.mongoClientPromise = client.connect()
  }
  return globalForMongo.mongoClientPromise
}

export function getDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || 'vapelounge'
}
