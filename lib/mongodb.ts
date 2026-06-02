import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isMongoConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const msg = String((err as Error).message || '')
  const name = String((err as { name?: string }).name || '')
  return (
    /timed out|timeout|ECONNRESET|ECONNREFUSED|ENOTFOUND|connection closed|network error/i.test(
      msg,
    ) || /MongoNetwork|MongoServerSelection|MongoTimeout/i.test(name)
  )
}

/** User-facing message for admin API responses. */
export function formatMongoError(err: unknown): string {
  if (isMongoConnectionError(err)) {
    return (
      'Database connection timed out. Wait a few seconds and try again. ' +
      'If this keeps happening, confirm MongoDB is running and that your server IP is allowed ' +
      '(Atlas Network Access or firewall on your database host).'
    )
  }
  return (err as Error)?.message || 'Database error'
}

/** Drop cached client so the next request opens a fresh connection (stale pool on serverless). */
export function resetMongoClient(): void {
  const existing = globalForMongo.mongoClientPromise
  globalForMongo.mongoClientPromise = undefined
  if (existing) {
    void existing.then(c => c.close(true).catch(() => {}))
  }
}

/**
 * Cached MongoDB client for serverless (Vercel): reuses the connection promise
 * across invocations when possible.
 */
function getMongoClientPromise(): Promise<MongoClient> | null {
  const uri = process.env.MONGODB_URI
  if (!uri?.trim()) return null

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri, {
      // Small pool — each serverless instance should not hoard connections.
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 30_000,
      waitQueueTimeoutMS: 20_000,
      serverSelectionTimeoutMS: 20_000,
      connectTimeoutMS: 20_000,
      socketTimeoutMS: 60_000,
      heartbeatFrequencyMS: 10_000,
      compressors: ['zlib'],
    })
    globalForMongo.mongoClientPromise = client.connect().catch(err => {
      globalForMongo.mongoClientPromise = undefined
      throw err
    })
  }
  return globalForMongo.mongoClientPromise
}

/** Connect with retries and a ping to avoid serving requests on dead sockets. */
export async function connectMongo(): Promise<MongoClient | null> {
  if (!process.env.MONGODB_URI?.trim()) return null

  const maxAttempts = 3
  let lastErr: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      resetMongoClient()
      await sleep(400 * attempt)
    }

    try {
      const promise = getMongoClientPromise()
      if (!promise) return null
      const client = await promise
      await client.db(getDbName()).command({ ping: 1 }, { timeoutMS: 12_000 })
      return client
    } catch (err) {
      lastErr = err
      resetMongoClient()
      if (!isMongoConnectionError(err) || attempt === maxAttempts - 1) throw err
    }
  }

  throw lastErr
}

export function getDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || 'vapelounge'
}
