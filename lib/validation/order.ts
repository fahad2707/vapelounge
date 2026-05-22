import { z } from 'zod'

export const TAX_RATE = 0.13

const lineItemSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  cat: z.string().max(100).optional(),
  emoji: z.string().max(32).optional(),
  price: z.number().nonnegative().max(50_000),
  qty: z.number().int().positive().max(99),
})

export const createOrderSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().min(7).max(30),
  dob: z.string().min(8).max(32),
  items: z.array(lineItemSchema).min(1).max(50),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export function computeSubtotal(items: CreateOrderInput['items']): number {
  const raw = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  return Math.round(raw * 100) / 100
}

export function computeTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE * 100) / 100
}

export function computeOrderTotal(items: CreateOrderInput['items']): {
  subtotal: number
  tax: number
  total: number
} {
  const subtotal = computeSubtotal(items)
  const tax = computeTax(subtotal)
  const total = Math.round((subtotal + tax) * 100) / 100
  return { subtotal, tax, total }
}
