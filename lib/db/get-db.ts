import type { Db } from 'mongodb'
import { getMongoClientPromise, getDbName } from '@/lib/mongodb'
import { ensureDbIndexes } from '@/lib/db/indexes'

let indexesStarted = false

/** DB accessor — indexes build in background (never block catalog reads). */
export async function getDb(): Promise<Db | null> {
  const promise = getMongoClientPromise()
  if (!promise) return null
  const client = await promise
  const db = client.db(getDbName())
  if (!indexesStarted) {
    indexesStarted = true
    void ensureDbIndexes(db)
  }
  return db
}
