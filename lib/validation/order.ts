import { z } from 'zod'

const lineItemSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  cat: z.string().max(100).optional(),
  emoji: z.string().max(32).optional(),
  price: z.number().nonnegative().max(50_000),
  qty: z.number().int().positive().max(99),
})

export const createOrderSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(lineItemSchema).min(1).max(50),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export function computeOrderTotal(items: CreateOrderInput['items']): number {
  const raw = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  return Math.round(raw * 100) / 100
}
