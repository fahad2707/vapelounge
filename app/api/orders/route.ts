import { NextResponse } from 'next/server'
import { getMongoClientPromise, getDbName } from '@/lib/mongodb'
import { COL } from '@/lib/db/collections'
import { computeOrderTotal, createOrderSchema } from '@/lib/validation/order'

export const dynamic = 'force-dynamic'

const MAX_ORDER_CAD = 25_000

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
  const total = computeOrderTotal(data.items)
  if (total <= 0 || total > MAX_ORDER_CAD) {
    return NextResponse.json({ error: 'Invalid order total' }, { status: 422 })
  }

  const promise = getMongoClientPromise()
  if (!promise) {
    return NextResponse.json(
      {
        error: 'Orders unavailable',
        message: 'MongoDB is not configured. Set MONGODB_URI on Vercel.',
      },
      { status: 503 },
    )
  }

  try {
    const client = await promise
    const orders = client.db(getDbName()).collection(COL.orders)
    const now = new Date()
    const doc = {
      email: data.email.toLowerCase().trim(),
      customerName: data.name?.trim() || null,
      notes: data.notes?.trim() || null,
      items: data.items.map(i => ({
        id: i.id,
        name: i.name,
        cat: i.cat ?? null,
        emoji: i.emoji ?? null,
        price: i.price,
        qty: i.qty,
      })),
      total,
      currency: 'CAD' as const,
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    }

    const result = await orders.insertOne(doc)

    return NextResponse.json(
      {
        ok: true,
        orderId: result.insertedId.toString(),
        total,
        currency: 'CAD',
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
