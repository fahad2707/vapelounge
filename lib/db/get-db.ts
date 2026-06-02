import type { Db } from 'mongodb'
import { connectMongo, getDbName } from '@/lib/mongodb'
import { ensureDbIndexes } from '@/lib/db/indexes'

let indexesStarted = false

/** DB accessor — indexes build in background (never block reads). */
export async function getDb(): Promise<Db | null> {
  const client = await connectMongo()
  if (!client) return null
  const db = client.db(getDbName())

  // Avoid hammering Atlas with many createIndex calls during serverless cold starts.
  if (!indexesStarted) {
    indexesStarted = true
    const runIndexes = process.env.MONGODB_ENSURE_INDEXES === '1'
    if (runIndexes || process.env.NODE_ENV !== 'production') {
      void ensureDbIndexes(db)
    }
  }

  return db
}
