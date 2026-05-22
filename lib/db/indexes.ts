import type { Db } from 'mongodb'
import { COL } from '@/lib/db/collections'

/**
 * Indexes for admin lists and the public shop catalog. Called from any code path
 * that queries Mongo (not only admin routes).
 */
const indexCache = new WeakMap<Db, Promise<void>>()

export function ensureDbIndexes(db: Db): Promise<void> {
  const cached = indexCache.get(db)
  if (cached) return cached
  const p = createDbIndexes(db).catch(err => {
    indexCache.delete(db)
    console.error('[db/indexes] ensureDbIndexes failed', err)
  })
  indexCache.set(db, p)
  return p
}

async function createDbIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection(COL.products).createIndex(
      { updatedAt: -1, name: 1 },
      { name: 'admin_list_updatedAt_name' },
    ),
    db.collection(COL.products).createIndex(
      { visible: 1, name: 1 },
      { name: 'shop_visible_name' },
    ),
    db.collection(COL.categories).createIndex(
      { featured: -1, name: 1 },
      { name: 'admin_list_featured_name' },
    ),
    db.collection(COL.categories).createIndex(
      { shopDisplay: 1, shopDisplayOrder: 1, name: 1 },
      { name: 'shop_display_order' },
    ),
    db.collection(COL.models).createIndex(
      { name: 1 },
      { name: 'admin_list_name' },
    ),
    db.collection(COL.variantGroups).createIndex(
      { name: 1 },
      { name: 'admin_list_name' },
    ),
    db.collection(COL.orders).createIndex({ createdAt: -1 }, { name: 'orders_createdAt' }),
    db.collection(COL.users).createIndex({ email: 1 }, { unique: true, name: 'users_email' }),
    db.collection(COL.users).createIndex({ createdAt: -1 }, { name: 'users_createdAt' }),
  ])
}
