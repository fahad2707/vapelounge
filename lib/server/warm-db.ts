import { getDb } from '@/lib/db/get-db'

/** One cheap read so MongoDB connects during the page render (before client API calls). */
export async function warmAdminDb(): Promise<void> {
  try {
    const db = await getDb()
    if (!db) return
    await db.command({ ping: 1 }, { timeoutMS: 8_000 })
  } catch {
    /* client fetch will surface errors */
  }
}
