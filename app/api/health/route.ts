import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/get-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = await getDb()
  if (!db) {
    return NextResponse.json(
      { ok: true, database: 'not_configured', hint: 'Set MONGODB_URI to enable MongoDB.' },
      { status: 200 },
    )
  }

  try {
    await db.command({ ping: 1 })
    return NextResponse.json({ ok: true, database: 'up' }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false, database: 'down' }, { status: 503 })
  }
}
