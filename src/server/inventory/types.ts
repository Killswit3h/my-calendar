import type { Prisma } from '@prisma/client'

export const inventoryItemRelations = {
  InventoryCategory: true,
  InventoryLocation: true,
  InventoryStock: {
    include: {
      InventoryLocation: true,
    },
  },
} satisfies Prisma.InventoryItemInclude

export type InventoryItemWithRelations = Prisma.InventoryItemGetPayload<{
  include: typeof inventoryItemRelations
}>

export type InventoryListOptions = {
  includeDeleted?: boolean
}

export const inventoryLocationRelations = {
  InventoryStock: {
    include: {
      InventoryItem: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
        },
      },
    },
  },
} satisfies Prisma.InventoryLocationInclude

export type InventoryLocationWithRelations = Prisma.InventoryLocationGetPayload<{
  include: typeof inventoryLocationRelations
}>
