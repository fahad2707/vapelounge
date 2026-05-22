import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'

export async function GET() {
  const block = await requireAdmin()
  if (block) return block
  try {
    const db = await getAdminDb()
    const docs = await db
      .collection(COL.users)
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray()

    return NextResponse.json({
      users: docs.map(d => ({
        id: (d._id as ObjectId).toString(),
        name: (d.name as string) || '',
        email: (d.email as string) || '',
        phone: (d.phone as string) || '',
        dob: (d.dob as string) || '',
        lastSource: (d.lastSource as string) || '',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    })
  } catch (err) {
    console.error('[admin/users GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
