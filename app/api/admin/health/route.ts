import { NextResponse } from 'next/server'
import { COL } from '@/lib/db/collections'
import { getDb } from '@/lib/db/get-db'
import { requireAdmin } from '@/lib/admin/guard'
import { formatMongoError, getMongoConnectionInfo } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Admin-only DB diagnostic — shows which host Vercel/production is using (no secrets). */
export async function GET() {
  const block = await requireAdmin()
  if (block) return block

  const info = getMongoConnectionInfo()
  if (!info.configured) {
    return NextResponse.json(
      { ok: false, error: 'MONGODB_URI is not set on this deployment.', connection: info },
      { status: 503 },
    )
  }

  try {
    const t0 = Date.now()
    const db = await getDb()
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Could not open database.', connection: info },
        { status: 503 },
      )
    }
    await db.command({ ping: 1 }, { timeoutMS: 10_000 })
    const productCount = await db.collection(COL.products).estimatedDocumentCount()
    return NextResponse.json({
      ok: true,
      pingMs: Date.now() - t0,
      productCount,
      connection: info,
      hint:
        info.isDirectIp
          ? 'Wrong URI type: use mongodb+srv://….mongodb.net/… from Atlas, not a raw IP.'
          : info.isAtlas
            ? 'Atlas URI detected. If admin still fails intermittently, check cluster is not paused.'
            : 'Verify MONGODB_URI on Vercel matches Atlas → Connect → Drivers.',
    })
  } catch (err) {
    console.error('[admin/health]', err)
    return NextResponse.json(
      { ok: false, error: formatMongoError(err), connection: info },
      { status: 503 },
    )
  }
}
