import { Prisma, type PrismaClient } from '@prisma/client'

import { getPrisma } from '@/lib/db'
import { InventoryError } from './errors'
import {
  inventoryItemCreateSchema,
  inventoryItemIdSchema,
  inventoryItemListOptionsSchema,
  inventoryItemUpdateSchema,
  type InventoryItemCreateInput,
  type InventoryItemCreateParsed,
  type InventoryItemListOptionsInput,
  type InventoryItemListOptions,
  type InventoryItemUpdateInput,
  type InventoryItemUpdateParsed,
} from './validation'
import { inventoryItemRelations, type InventoryItemWithRelations } from './types'

type PrismaTx = PrismaClient | Prisma.TransactionClient

function toInventoryError(err: unknown): InventoryError {
  if (err instanceof InventoryError) return err
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta?.target.join(',') : String(err.meta?.target ?? '')
      const field = target.includes('barcode') ? 'barcode' : 'sku'
      return new InventoryError('CONFLICT', `Inventory item with that ${field} already exists`, {
        cause: err,
        meta: { target: err.meta?.target },
      })
    }
    if (err.code === 'P2025') {
      return new InventoryError('NOT_FOUND', 'Inventory item not found', { cause: err })
    }
  }
  return new InventoryError('UNKNOWN', 'Unexpected inventory error', { cause: err instanceof Error ? err : undefined })
}

const itemInclude = inventoryItemRelations

async function resolveClient(client?: PrismaTx): Promise<PrismaTx> {
  if (client) return client
  return await getPrisma()
}

function buildCreateData(input: InventoryItemCreateParsed): Prisma.InventoryItemUncheckedCreateInput {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sku: input.sku,
    name: input.name,
    description: input.description ?? null,
    unit: input.unit,
    isConsumable: input.isConsumable ?? false,
    minStock: input.minStock ?? 0,
    barcode: input.barcode ?? null,
    categoryId: input.categoryId ?? null,
    defaultLocationId: input.defaultLocationId ?? null,
    updatedAt: new Date(),
  }
}

function buildUpdateData(input: InventoryItemUpdateParsed): Prisma.InventoryItemUncheckedUpdateInput {
  const data: Prisma.InventoryItemUncheckedUpdateInput = {}

  if (input.sku !== undefined) data.sku = input.sku
  if (input.name !== undefined) data.name = input.name
  if (input.description !== undefined) data.description = input.description ?? null
  if (input.unit !== undefined) data.unit = input.unit
  if (input.isConsumable !== undefined) data.isConsumable = input.isConsumable
  if (input.minStock !== undefined) data.minStock = input.minStock
  if (input.barcode !== undefined) data.barcode = input.barcode ?? null
  if (input.categoryId !== undefined) data.categoryId = input.categoryId ?? null
  if (input.defaultLocationId !== undefined) data.defaultLocationId = input.defaultLocationId ?? null

  return data
}

export async function listInventoryItems(
  options?: InventoryItemListOptionsInput,
  client?: PrismaTx,
): Promise<InventoryItemWithRelations[]> {
  const parsed = inventoryItemListOptionsSchema.parse(options ?? {})
  const prisma = await resolveClient(client)
  return prisma.inventoryItem.findMany({
    where: parsed.includeDeleted ? {} : { deletedAt: null },
    orderBy: { name: 'asc' },
    include: itemInclude,
  })
}

export async function getInventoryItem(
  id: string,
  options: { includeDeleted?: boolean } = {},
  client?: PrismaTx,
): Promise<InventoryItemWithRelations> {
  const itemId = inventoryItemIdSchema.parse(id)
  const prisma = await resolveClient(client)
  const record = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: itemInclude,
  })
  if (!record || (!options.includeDeleted && record.deletedAt)) {
    throw new InventoryError('NOT_FOUND', 'Inventory item not found')
  }
  return record
}

export async function createInventoryItem(
  input: InventoryItemCreateInput,
  client?: PrismaTx,
): Promise<InventoryItemWithRelations> {
  const data = inventoryItemCreateSchema.parse(input)
  const prisma = await resolveClient(client)
  try {
    return await prisma.inventoryItem.create({
      data: buildCreateData(data),
      include: itemInclude,
    })
  } catch (err) {
    throw toInventoryError(err)
  }
}

export async function updateInventoryItem(
  id: string,
  input: InventoryItemUpdateInput,
  client?: PrismaTx,
): Promise<InventoryItemWithRelations> {
  const itemId = inventoryItemIdSchema.parse(id)
  const data = inventoryItemUpdateSchema.parse(input)
  const prisma = await resolveClient(client)

  const updateData = buildUpdateData(data)
  if (Object.keys(updateData).length === 0) {
    throw new InventoryError('VALIDATION', 'No fields provided for update')
  }

  try {
    return await prisma.inventoryItem.update({
      where: { id: itemId },
      data: updateData,
      include: itemInclude,
    })
  } catch (err) {
    throw toInventoryError(err)
  }
}

export async function softDeleteInventoryItem(id: string, client?: PrismaTx): Promise<InventoryItemWithRelations> {
  const itemId = inventoryItemIdSchema.parse(id)
  const prisma = await resolveClient(client)

  const [reservations, openCheckouts, existing] = await Promise.all([
    prisma.inventoryReservation.count({ where: { itemId } }),
    prisma.inventoryCheckout.count({ where: { itemId, status: { not: 'CLOSED' } } }),
    prisma.inventoryItem.findUnique({ where: { id: itemId }, include: itemInclude }),
  ])

  if (!existing) {
    throw new InventoryError('NOT_FOUND', 'Inventory item not found')
  }

  if (reservations > 0 || openCheckouts > 0) {
    throw new InventoryError('DEPENDENCY', 'Cannot delete item with active reservations or open checkouts', {
      meta: { reservations, openCheckouts },
    })
  }

  if (existing.deletedAt) {
    return existing
  }

  return prisma.inventoryItem.update({
    where: { id: itemId },
    data: { deletedAt: new Date() },
    include: itemInclude,
  })
}
