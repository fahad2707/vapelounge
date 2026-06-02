import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export interface MongoConnectionInfo {
  configured: boolean
  host: string | null
  isAtlas: boolean
  isDirectIp: boolean
  dbName: string
}

/** Safe summary of MONGODB_URI for logs and admin diagnostics (no credentials). */
export function getMongoConnectionInfo(): MongoConnectionInfo {
  const uri = process.env.MONGODB_URI?.trim()
  const dbName = getDbName()
  if (!uri) {
    return { configured: false, host: null, isAtlas: false, isDirectIp: false, dbName }
  }

  try {
    if (uri.startsWith('mongodb+srv://')) {
      const host = uri.match(/@([^/?]+)/)?.[1] ?? null
      return {
        configured: true,
        host,
        isAtlas: !!host?.includes('.mongodb.net'),
        isDirectIp: false,
        dbName,
      }
    }

    const withoutScheme = uri.replace(/^mongodb:\/\//, '')
    const hostPart = withoutScheme.includes('@')
      ? withoutScheme.split('@').pop()!
      : withoutScheme
    const host = hostPart.split('/')[0]?.split(':')[0] ?? null
    const isDirectIp = !!host && /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
    return {
      configured: true,
      host,
      isAtlas: !!host?.includes('.mongodb.net'),
      isDirectIp,
      dbName,
    }
  } catch {
    return { configured: true, host: '(unparseable)', isAtlas: false, isDirectIp: false, dbName }
  }
}

export function isMongoConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const msg = String((err as Error).message || '')
  const name = String((err as { name?: string }).name || '')
  return (
    /timed out|timeout|ECONNRESET|ECONNREFUSED|ENOTFOUND|connection closed|network error|session that has ended|client must be connected/i.test(
      msg,
    ) || /MongoNetwork|MongoServerSelection|MongoTimeout/i.test(name)
  )
}

/** User-facing message for admin API responses. */
export function formatMongoError(err: unknown): string {
  const msg = String((err as Error)?.message || '')
  if (/session that has ended|client must be connected/i.test(msg)) {
    return 'Database connection was interrupted. Refresh the page and try again.'
  }

  if (!isMongoConnectionError(err)) {
    return msg || 'Database error'
  }

  const info = getMongoConnectionInfo()

  if (!info.configured) {
    return 'MONGODB_URI is not set on the server. Add it in Vercel → Settings → Environment Variables, then redeploy.'
  }

  if (info.isDirectIp && info.host) {
    return (
      `Database connection timed out to ${info.host}. ` +
      'That is a direct IP host, not MongoDB Atlas — Atlas Network Access will not help. ' +
      'Either open firewall port 27017 for that host, or change MONGODB_URI on Vercel to your Atlas string (mongodb+srv://….mongodb.net/…).'
    )
  }

  if (info.isAtlas && info.host) {
    return (
      `Database connection timed out (Atlas: ${info.host}). ` +
      'In Atlas, confirm the cluster is not paused, credentials in Vercel match Database Access, ' +
      'and Network Access allows 0.0.0.0/0. Then redeploy after saving MONGODB_URI.'
    )
  }

  return (
    `Database connection timed out${info.host ? ` (${info.host})` : ''}. ` +
    'Check MONGODB_URI on Vercel matches your Atlas connection string and redeploy.'
  )
}

/**
 * Forget the cached client promise so the next call connects again.
 * Does NOT call client.close() — closing kills in-flight work on concurrent serverless requests.
 */
export function resetMongoClient(): void {
  globalForMongo.mongoClientPromise = undefined
}

function getMongoClientPromise(): Promise<MongoClient> | null {
  const uri = process.env.MONGODB_URI
  if (!uri?.trim()) return null

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri, {
      // Allow parallel admin fetches (categories + products + models) on one warm instance.
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 120_000,
      waitQueueTimeoutMS: 25_000,
      serverSelectionTimeoutMS: 15_000,
      connectTimeoutMS: 15_000,
      socketTimeoutMS: 45_000,
      heartbeatFrequencyMS: 10_000,
    })
    globalForMongo.mongoClientPromise = client.connect().catch(err => {
      globalForMongo.mongoClientPromise = undefined
      throw err
    })
  }
  return globalForMongo.mongoClientPromise
}

/** Connect with one retry. No per-request ping — that added ~10s+ on slow Atlas links. */
export async function connectMongo(): Promise<MongoClient | null> {
  if (!process.env.MONGODB_URI?.trim()) return null

  const maxAttempts = 2
  let lastErr: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      resetMongoClient()
      await sleep(500)
    }

    try {
      const promise = getMongoClientPromise()
      if (!promise) return null
      return await promise
    } catch (err) {
      lastErr = err
      if (attempt < maxAttempts - 1) resetMongoClient()
      if (!isMongoConnectionError(err) || attempt === maxAttempts - 1) throw err
    }
  }

  throw lastErr
}

export function getDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || 'vapelounge'
}
