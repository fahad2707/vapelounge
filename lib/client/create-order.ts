import type { CreateOrderInput } from '@/lib/validation/order'

type CreateOrderResponse = {
  ok: true
  orderId: string
  total: number
  currency: string
}

/** Call from a Client Component (e.g. checkout) to persist an order. */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  let body: unknown = {}
  try {
    body = await res.json()
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      typeof body === 'object' && body && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Request failed (${res.status})`
    throw new Error(msg)
  }
  return body as CreateOrderResponse
}
