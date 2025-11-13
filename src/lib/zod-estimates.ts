import { z } from 'zod'

export const LineItemZ = z.object({
  sort: z.number().int().nonnegative(),
  description: z.string().min(1),
  qty: z.union([z.string(), z.number()]),
  uom: z.string().min(1),
  rateCents: z.number().int().nonnegative(),
  taxable: z.boolean().optional().default(false),
  note: z.string().optional().nullable(),
})

export const EstimateFormZ = z.object({
  date: z.string().min(1),
  customerId: z.string().optional(),
  projectId: z.string().optional().nullable(),
  attention: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  discountCents: z.number().int().nonnegative().default(0),
  taxCents: z.number().int().nonnegative().default(0),
  lineItems: z.array(LineItemZ).min(1),
})

export type EstimateFormT = z.input<typeof EstimateFormZ>
