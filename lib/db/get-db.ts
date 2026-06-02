import type { Db } from 'mongodb'
import { connectMongo, getDbName } from '@/lib/mongodb'
import { ensureDbIndexes } from '@/lib/db/indexes'

let indexesStarted = false

/** DB accessor — indexes build once in the background (idempotent, fast if they exist). */
export async function getDb(): Promise<Db | null> {
  const client = await connectMongo()
  if (!client) return null
  const db = client.db(getDbName())

  if (!indexesStarted) {
    indexesStarted = true
    void ensureDbIndexes(db)
  }

  return db
}
