import { z } from 'zod'

const statusEnum = z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'INVOICED'])

export const LineItemInput = z.object({
  id: z.string().optional(),
  sort: z.number().int().nonnegative(),
  description: z.string().min(1),
  qty: z.union([z.string(), z.number()]),
  uom: z.string().min(1),
  rateCents: z.number().int().nonnegative(),
  taxable: z.boolean().optional().default(false),
  note: z.string().optional().nullable(),
})

export const EstimateCreateInput = z.object({
  date: z.union([z.string(), z.date()]),
  customerId: z.string().optional(),
  projectId: z.string().optional().nullable(),
  attention: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  discountCents: z.number().int().nonnegative().default(0),
  taxCents: z.number().int().nonnegative().default(0),
  lineItems: z.array(LineItemInput).min(1),
})

export const EstimateUpdateInput = EstimateCreateInput.partial().extend({
  status: statusEnum.optional(),
})

export const EstimateQuery = z.object({
  customerId: z.string().optional(),
  projectId: z.string().optional(),
  status: statusEnum.optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const ChangeOrderCreateInput = z.object({
  date: z.union([z.string(), z.date()]),
  projectId: z.string(),
  baseEstimateId: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  discountCents: z.number().int().nonnegative().default(0),
  taxCents: z.number().int().nonnegative().default(0),
  lineItems: z.array(LineItemInput).min(1),
})

export const ChangeOrderUpdateInput = ChangeOrderCreateInput.partial().extend({
  status: statusEnum.optional(),
})

export const ChangeOrderQuery = EstimateQuery
