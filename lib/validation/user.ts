import { z } from 'zod'

export const upsertUserSchema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().max(254),
  phone: z.string().max(30).optional(),
  dob: z.string().max(32).optional(),
  source: z.enum(['checkout', 'age_gate', 'wishlist']).optional(),
})
