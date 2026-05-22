import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/get-db'
import { COL } from '@/lib/db/collections'
import { computeOrderTotal, createOrderSchema } from '@/lib/validation/order'
export const dynamic = 'force-dynamic'

const MAX_ORDER_CAD = 50_000

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const data = parsed.data
  const { subtotal, tax, total } = computeOrderTotal(data.items)
  if (subtotal <= 0 || total > MAX_ORDER_CAD) {
    return NextResponse.json({ error: 'Invalid order total' }, { status: 422 })
  }

  const db = await getDb()
  if (!db) {
    return NextResponse.json(
      {
        error: 'Orders unavailable',
        message: 'MongoDB is not configured. Set MONGODB_URI on Vercel.',
      },
      { status: 503 },
    )
  }

  try {
    const now = new Date()
    const email = data.email.toLowerCase().trim()

    await db.collection(COL.users).updateOne(
      { email },
      {
        $set: {
          name: data.name.trim(),
          email,
          phone: data.phone.trim(),
          dob: data.dob,
          updatedAt: now,
          lastSource: 'checkout' as const,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    )

    const doc = {
      email,
      customerName: data.name.trim(),
      phone: data.phone.trim(),
      dob: data.dob,
      items: data.items.map(i => ({
        id: i.id,
        name: i.name,
        cat: i.cat ?? null,
        emoji: i.emoji ?? null,
        price: i.price,
        qty: i.qty,
      })),
      subtotal,
      taxRate: 0.13,
      tax,
      total,
      currency: 'CAD' as const,
      status: 'pending_pickup' as const,
      fulfillment: 'in_store_pickup' as const,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection(COL.orders).insertOne(doc)

    return NextResponse.json(
      {
        ok: true,
        orderId: result.insertedId.toString(),
        subtotal,
        tax,
        total,
        currency: 'CAD',
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[api/orders POST]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
