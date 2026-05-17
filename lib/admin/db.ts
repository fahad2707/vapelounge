import { Db } from 'mongodb'
import { getMongoClientPromise, getDbName } from '@/lib/mongodb'
import { COL } from '@/lib/db/collections'

/** Returns the configured DB or throws with a friendly message. */
export async function getAdminDb(): Promise<Db> {
  const promise = getMongoClientPromise()
  if (!promise) {
    throw new Error(
      'MONGODB_URI is not configured on the server. Add it to your environment (.env.local for dev).',
    )
  }
  const client = await promise
  const db = client.db(getDbName())
  await ensureAdminIndexes(db)
  return db
}

/**
 * Lazily create the indexes that back admin list sorts. Without these the
 * server does an in-memory sort and trips Mongo's 32 MB sort limit once the
 * `products` collection grows beyond a few hundred sizeable docs (the bug:
 * "Sort exceeded memory limit of 33554432 bytes" while reloading the admin
 * product list).
 *
 * `createIndex` is idempotent (no-op if an equivalent index already exists),
 * but we cache the resolved promise per `Db` instance so we only fire one
 * round-trip per server process.
 */
const indexCache = new WeakMap<Db, Promise<void>>()

function ensureAdminIndexes(db: Db): Promise<void> {
  const cached = indexCache.get(db)
  if (cached) return cached
  const p = createAdminIndexes(db).catch(err => {
    // Don't permanently poison the cache on a transient failure — clear it so
    // the next request retries. We still resolve so admin requests don't hard
    // fail purely because the index step had a hiccup.
    indexCache.delete(db)
    console.error('[admin/db] ensureAdminIndexes failed', err)
  })
  indexCache.set(db, p)
  return p
}

async function createAdminIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection(COL.products).createIndex(
      { updatedAt: -1, name: 1 },
      { name: 'admin_list_updatedAt_name' },
    ),
    db.collection(COL.categories).createIndex(
      { featured: -1, name: 1 },
      { name: 'admin_list_featured_name' },
    ),
    db.collection(COL.models).createIndex(
      { name: 1 },
      { name: 'admin_list_name' },
    ),
    db.collection(COL.variantGroups).createIndex(
      { name: 1 },
      { name: 'admin_list_name' },
    ),
  ])
}
