import { NextResponse } from 'next/server'
import { getMongoClientPromise, getDbName } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  const promise = getMongoClientPromise()
  if (!promise) {
    return NextResponse.json(
      { ok: true, database: 'not_configured', hint: 'Set MONGODB_URI to enable MongoDB.' },
      { status: 200 },
    )
  }

  try {
    const client = await promise
    await client.db(getDbName()).command({ ping: 1 })
    return NextResponse.json({ ok: true, database: 'up' }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false, database: 'down' }, { status: 503 })
  }
}
