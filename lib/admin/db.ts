import { getDb } from '@/lib/db/get-db'
import { formatMongoError, isMongoConnectionError, resetMongoClient } from '@/lib/mongodb'

/** Returns the configured DB or throws with a friendly message. Retries once on connection timeout. */
export async function getAdminDb() {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const db = await getDb()
      if (!db) {
        throw new Error(
          'MONGODB_URI is not configured on the server. Add it to your environment (.env.local for dev).',
        )
      }
      return db
    } catch (err) {
      if (attempt === 0 && isMongoConnectionError(err)) {
        resetMongoClient()
        continue
      }
      throw new Error(formatMongoError(err))
    }
  }

  throw new Error(formatMongoError(new Error('Database unavailable')))
}
