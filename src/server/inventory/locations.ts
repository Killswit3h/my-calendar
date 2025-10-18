import { Prisma, type PrismaClient } from '@prisma/client'

import { getPrisma } from '@/lib/db'
import { InventoryError } from './errors'
import {
  inventoryLocationCreateSchema,
  inventoryLocationIdSchema,
  inventoryLocationUpdateSchema,
  type InventoryLocationCreateInput,
  type InventoryLocationCreateParsed,
  type InventoryLocationUpdateInput,
  type InventoryLocationUpdateParsed,
} from './validation'
import { inventoryLocationRelations, type InventoryLocationWithRelations } from './types'

type PrismaTx = PrismaClient | Prisma.TransactionClient

const locationInclude = inventoryLocationRelations

async function resolveClient(client?: PrismaTx): Promise<PrismaTx> {
  if (client) return client
  return await getPrisma()
}

function buildCreateData(input: InventoryLocationCreateParsed): Prisma.InventoryLocationUncheckedCreateInput {
  return {
    id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: input.name,
    code: input.code,
    isTruck: input.isTruck ?? false,
    updatedAt: new Date(),
  }
}

function buildUpdateData(input: InventoryLocationUpdateParsed): Prisma.InventoryLocationUncheckedUpdateInput {
  const data: Prisma.InventoryLocationUncheckedUpdateInput = {}
  if (input.name !== undefined) data.name = input.name
  if (input.code !== undefined) data.code = input.code
  if (input.isTruck !== undefined) data.isTruck = input.isTruck
  return data
}

function toLocationError(error: unknown): InventoryError {
  if (error instanceof InventoryError) return error
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : String(error.meta?.target ?? '')
      const field = target.includes('code') ? 'code' : 'name'
      return new InventoryError('CONFLICT', `Inventory location with that ${field} already exists`, {
        cause: error,
        meta: { target: error.meta?.target },
      })
    }
    if (error.code === 'P2025') {
      return new InventoryError('NOT_FOUND', 'Inventory location not found', { cause: error })
    }
  }
  return new InventoryError('UNKNOWN', 'Unexpected inventory error', { cause: error instanceof Error ? error : undefined })
}

export async function listInventoryLocations(client?: PrismaTx): Promise<InventoryLocationWithRelations[]> {
  const prisma = await resolveClient(client)
  return prisma.inventoryLocation.findMany({
    orderBy: [{ isTruck: 'desc' }, { name: 'asc' }],
    include: locationInclude,
  })
}

export async function createInventoryLocation(
  input: InventoryLocationCreateInput,
  client?: PrismaTx,
): Promise<InventoryLocationWithRelations> {
  const data = inventoryLocationCreateSchema.parse(input)
  const prisma = await resolveClient(client)
  try {
    return await prisma.inventoryLocation.create({
      data: buildCreateData(data),
      include: locationInclude,
    })
  } catch (error) {
    throw toLocationError(error)
  }
}

export async function updateInventoryLocation(
  id: string,
  input: InventoryLocationUpdateInput,
  client?: PrismaTx,
): Promise<InventoryLocationWithRelations> {
  const locationId = inventoryLocationIdSchema.parse(id)
  const data = inventoryLocationUpdateSchema.parse(input)
  const updateData = buildUpdateData(data)
  if (Object.keys(updateData).length === 0) {
    throw new InventoryError('VALIDATION', 'No fields provided for update')
  }
  const prisma = await resolveClient(client)
  try {
    return await prisma.inventoryLocation.update({
      where: { id: locationId },
      data: updateData,
      include: locationInclude,
    })
  } catch (error) {
    throw toLocationError(error)
  }
}

export async function getInventoryLocation(id: string, client?: PrismaTx): Promise<InventoryLocationWithRelations> {
  const locationId = inventoryLocationIdSchema.parse(id)
  const prisma = await resolveClient(client)
  const record = await prisma.inventoryLocation.findUnique({ where: { id: locationId }, include: locationInclude })
  if (!record) {
    throw new InventoryError('NOT_FOUND', 'Inventory location not found')
  }
  return record
}
