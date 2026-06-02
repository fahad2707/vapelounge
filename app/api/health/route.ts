import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/get-db'
import { formatMongoError, getMongoConnectionInfo } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  const info = getMongoConnectionInfo()

  if (!info.configured) {
    return NextResponse.json(
      {
        ok: true,
        database: 'not_configured',
        hint: 'Set MONGODB_URI to enable MongoDB.',
        connection: info,
      },
      { status: 200 },
    )
  }

  try {
    const t0 = Date.now()
    const db = await getDb()
    if (!db) {
      return NextResponse.json(
        { ok: false, database: 'down', connection: info, error: 'Could not open database.' },
        { status: 503 },
      )
    }
    await db.command({ ping: 1 }, { timeoutMS: 10_000 })
    return NextResponse.json(
      {
        ok: true,
        database: 'up',
        pingMs: Date.now() - t0,
        connection: info,
      },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        database: 'down',
        connection: info,
        error: formatMongoError(err),
      },
      { status: 503 },
    )
  }
}
