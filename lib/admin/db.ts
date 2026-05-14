import { Db } from 'mongodb'
import { getMongoClientPromise, getDbName } from '@/lib/mongodb'

/** Returns the configured DB or throws with a friendly message. */
export async function getAdminDb(): Promise<Db> {
  const promise = getMongoClientPromise()
  if (!promise) {
    throw new Error(
      'MONGODB_URI is not configured on the server. Add it to your environment (.env.local for dev).',
    )
  }
  const client = await promise
  return client.db(getDbName())
}
