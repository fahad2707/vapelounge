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
      .collection(COL.orders)
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray()

    return NextResponse.json({
      orders: docs.map(d => ({
        id: (d._id as ObjectId).toString(),
        email: d.email as string,
        customerName: (d.customerName as string) || '',
        phone: (d.phone as string) || '',
        dob: (d.dob as string) || '',
        items: d.items,
        subtotal: d.subtotal as number,
        tax: d.tax as number,
        total: d.total as number,
        currency: (d.currency as string) || 'CAD',
        status: (d.status as string) || 'pending',
        createdAt: d.createdAt,
      })),
    })
  } catch (err) {
    console.error('[admin/orders GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
