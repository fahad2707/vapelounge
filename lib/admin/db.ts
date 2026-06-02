import { getDb } from '@/lib/db/get-db'
import { formatMongoError } from '@/lib/mongodb'

/** Returns the configured DB or throws with a friendly message. */
export async function getAdminDb() {
  const db = await getDb()
  if (!db) {
    throw new Error(
      'MONGODB_URI is not configured on the server. Add it to your environment (.env.local for dev).',
    )
  }
  return db
}

/** Wrap route handlers — maps Mongo errors to readable API messages. */
export function adminDbError(err: unknown): Error {
  return new Error(formatMongoError(err))
}
