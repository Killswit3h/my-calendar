import { z } from 'zod'

const idSchema = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(40, 'Too long')

const nullableString = (max: number) =>
  z.preprocess(
    value => {
      if (value === undefined || value === null) return null
      if (typeof value !== 'string') return value
      const trimmed = value.trim()
      return trimmed.length ? trimmed : null
    },
    z.string().max(max, `Must be <= ${max} characters`).nullable(),
  )

const optionalNullableString = (max: number) => nullableString(max).optional()

const requiredTrimmed = (max: number) =>
  z.preprocess(
    value => {
      if (typeof value !== 'string') return value
      return value.trim()
    },
    z.string().min(1, 'Required').max(max, `Must be <= ${max} characters`),
  )

const nullableId = z
  .preprocess(
    value => {
      if (value === undefined || value === null) return null
      if (typeof value !== 'string') return value
      const trimmed = value.trim()
      return trimmed.length ? trimmed : null
    },
    idSchema.nullable(),
  )

const optionalNullableId = nullableId.optional()

const minStockSchema = z.coerce.number().int().min(0, 'Must be >= 0').max(1_000_000, 'Too large')

const createFields = {
  sku: requiredTrimmed(64),
  name: requiredTrimmed(200),
  description: optionalNullableString(2000),
  unit: requiredTrimmed(32),
  isConsumable: z.coerce.boolean().default(false),
  minStock: minStockSchema.default(0),
  barcode: optionalNullableString(128),
  categoryId: optionalNullableId,
  defaultLocationId: optionalNullableId,
}

export const inventoryItemCreateSchema = z.object(createFields)

export const inventoryItemUpdateSchema = z.object({
  sku: requiredTrimmed(64).optional(),
  name: requiredTrimmed(200).optional(),
  description: optionalNullableString(2000),
  unit: requiredTrimmed(32).optional(),
  isConsumable: z.coerce.boolean().optional(),
  minStock: minStockSchema.optional(),
  barcode: optionalNullableString(128),
  categoryId: optionalNullableId,
  defaultLocationId: optionalNullableId,
})

export const inventoryItemIdSchema = idSchema

export const inventoryItemListOptionsSchema = z
  .object({
    includeDeleted: z.coerce.boolean().optional().default(false),
  })
  .default({ includeDeleted: false })

export type InventoryItemCreateInput = z.input<typeof inventoryItemCreateSchema>
export type InventoryItemCreateParsed = z.infer<typeof inventoryItemCreateSchema>

export type InventoryItemUpdateInput = z.input<typeof inventoryItemUpdateSchema>
export type InventoryItemUpdateParsed = z.infer<typeof inventoryItemUpdateSchema>

export type InventoryItemListOptionsInput = z.input<typeof inventoryItemListOptionsSchema>
export type InventoryItemListOptions = z.infer<typeof inventoryItemListOptionsSchema>

/* -------- Locations -------- */

const locationCreateFields = {
  name: requiredTrimmed(120),
  code: requiredTrimmed(32),
  isTruck: z.coerce.boolean().default(false),
}

export const inventoryLocationCreateSchema = z.object(locationCreateFields)

export const inventoryLocationUpdateSchema = z.object({
  name: requiredTrimmed(120).optional(),
  code: requiredTrimmed(32).optional(),
  isTruck: z.coerce.boolean().optional(),
})

export const inventoryLocationIdSchema = idSchema

export type InventoryLocationCreateInput = z.input<typeof inventoryLocationCreateSchema>
export type InventoryLocationCreateParsed = z.infer<typeof inventoryLocationCreateSchema>

export type InventoryLocationUpdateInput = z.input<typeof inventoryLocationUpdateSchema>
export type InventoryLocationUpdateParsed = z.infer<typeof inventoryLocationUpdateSchema>
