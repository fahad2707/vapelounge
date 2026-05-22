import type { Db } from 'mongodb'
import { getMongoClientPromise, getDbName } from '@/lib/mongodb'
import { ensureDbIndexes } from '@/lib/db/indexes'

/** Shared DB accessor — ensures indexes before returning. */
export async function getDb(): Promise<Db | null> {
  const promise = getMongoClientPromise()
  if (!promise) return null
  const client = await promise
  const db = client.db(getDbName())
  await ensureDbIndexes(db)
  return db
}
