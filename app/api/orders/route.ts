import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/get-db'
import { COL } from '@/lib/db/collections'
import { computeOrderTotal, createOrderSchema } from '@/lib/validation/order'
export const dynamic = 'force-dynamic'

const MAX_ORDER_CAD = 50_000

async function sendAdminOrderEmail(order: any, origin: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not defined. Skipping email notification.')
    return
  }

  const adminEmail = 'vape.lounge92@gmail.com'
  const orderUrl = `${origin}/admin/orders`

  const itemsHtml = order.items
    .map(
      (item: any) =>
        `<li><strong>${item.name}</strong> x ${item.qty} - $${(item.price * item.qty).toFixed(2)}</li>`
    )
    .join('')

  const emailBody = {
    from: 'Vape Lounge <onboarding@resend.dev>',
    to: adminEmail,
    subject: `🚨 New Order Received! ($${order.total.toFixed(2)})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">🚨 New Online Order</h2>
        <p>A new order has been placed on Vape Lounge.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Customer Name:</td>
            <td style="padding: 8px 0; color: #0f172a;">${order.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
            <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${order.email}">${order.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone:</td>
            <td style="padding: 8px 0; color: #0f172a;"><a href="tel:${order.phone}">${order.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">DOB:</td>
            <td style="padding: 8px 0; color: #0f172a;">${order.dob}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Fulfillment:</td>
            <td style="padding: 8px 0; color: #0f172a;">In-Store Pickup</td>
          </tr>
        </table>

        <h3 style="color: #0f172a; margin-top: 20px;">Items Ordered</h3>
        <ul style="padding-left: 20px; color: #334155; line-height: 1.6;">
          ${itemsHtml}
        </ul>

        <div style="margin-top: 30px; padding: 15px; background-color: #f8fafc; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal:</span>
            <strong>$${order.subtotal.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Tax (13%):</span>
            <strong>$${order.tax.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.1em; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
            <span>Total:</span>
            <span style="color: #0f172a;">$${order.total.toFixed(2)} CAD</span>
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${orderUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Order in Admin Panel
          </a>
        </div>
      </div>
    `,
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Resend] Email notification failed:', errorText)
    } else {
      console.log('[Resend] Email notification sent successfully to', adminEmail)
    }
  } catch (err) {
    console.error('[Resend] Error calling Resend API:', err)
  }
}

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

    try {
      const origin = new URL(req.url).origin
      const docWithId = { ...doc, _id: result.insertedId }
      await sendAdminOrderEmail(docWithId, origin)
    } catch (emailErr) {
      console.error('[Order Email] Failed to send email notification:', emailErr)
    }

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
