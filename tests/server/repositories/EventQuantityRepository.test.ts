import { describe, it, expect, beforeEach } from "vitest"
import { EventQuantityRepository } from "@/server/repositories/EventQuantityRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEventQuantity } from "../../utils/mockPrismaEventQuantity"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

// Run the abstract repository tests with EventQuantity configuration
const abstractTests = createAbstractRepositoryTests<
  EventQuantityRepository,
  PrismaTypes.event_quantityGetPayload<{}>,
  PrismaTypes.event_quantityCreateInput,
  PrismaTypes.event_quantityUpdateInput,
  PrismaTypes.event_quantityWhereUniqueInput,
  PrismaTypes.event_quantityWhereInput
>({
  repositoryClass: EventQuantityRepository,
  modelName: "event_quantity",
  createValidInput: () => ({
    event: { connect: { id: 1 } },
    project_pay_item: { connect: { id: 1 } },
    quantity: new Prisma.Decimal(100.0),
  }),
  createUpdateInput: () => ({
    notes: "Updated notes",
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: Record<string, any>) => filters as any,
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    // Ensure event and project_pay_item exist
    ;(mockPrisma as any).addEvent({ id: data.event?.connect?.id ?? 1 })
    ;(mockPrisma as any).addProjectPayItem({ id: data.project_pay_item?.connect?.id ?? 1 })
    
    return (mockPrisma as any).addEventQuantity({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      event_id: data.event?.connect?.id ?? 1,
      project_pay_item_id: data.project_pay_item?.connect?.id ?? 1,
      quantity: data.quantity ?? 100.0,
    })
  },
  getIdFromModel: (model: any) => model.id,
  idField: "id",
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithEventQuantity(mockPrisma)
  },
})

// Run abstract tests
describe("EventQuantityRepository", () => {
  // Execute all abstract repository tests
  abstractTests()

  // EventQuantity-specific custom method tests
  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: EventQuantityRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithEventQuantity(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new EventQuantityRepository()
    })

    describe("findByEventId", () => {
      it("should find event quantities by event ID", async () => {
        ;(mockPrisma as any).addEvent({ id: 1 })
        ;(mockPrisma as any).addEvent({ id: 2 })
        ;(mockPrisma as any).addProjectPayItem({ id: 1 })
        ;(mockPrisma as any).addProjectPayItem({ id: 2 })

        ;(mockPrisma as any).addEventQuantity({
          event_id: 1,
          project_pay_item_id: 1,
          quantity: 100.0,
        })
        ;(mockPrisma as any).addEventQuantity({
          event_id: 1,
          project_pay_item_id: 2,
          quantity: 200.0,
        })
        ;(mockPrisma as any).addEventQuantity({
          event_id: 2,
          project_pay_item_id: 1,
          quantity: 150.0,
        })

        const result = await repository.findByEventId(1)
        expect(result).toBeTruthy()
        expect(result.length).toBe(2)
        expect(result.every((item) => item.event_id === 1)).toBe(true)
      })

      it("should return empty array when no event quantities found", async () => {
        const result = await repository.findByEventId(999)
        expect(result).toEqual([])
      })
    })

    describe("findByProjectPayItemId", () => {
      it("should find event quantities by project pay item ID", async () => {
        ;(mockPrisma as any).addEvent({ id: 1 })
        ;(mockPrisma as any).addEvent({ id: 2 })
        ;(mockPrisma as any).addProjectPayItem({ id: 1 })
        ;(mockPrisma as any).addProjectPayItem({ id: 2 })

        ;(mockPrisma as any).addEventQuantity({
          event_id: 1,
          project_pay_item_id: 1,
          quantity: 100.0,
        })
        ;(mockPrisma as any).addEventQuantity({
          event_id: 2,
          project_pay_item_id: 1,
          quantity: 200.0,
        })
        ;(mockPrisma as any).addEventQuantity({
          event_id: 1,
          project_pay_item_id: 2,
          quantity: 150.0,
        })

        const result = await repository.findByProjectPayItemId(1)
        expect(result).toBeTruthy()
        expect(result.length).toBe(2)
        expect(result.every((item) => item.project_pay_item_id === 1)).toBe(true)
      })

      it("should return empty array when no event quantities found", async () => {
        const result = await repository.findByProjectPayItemId(999)
        expect(result).toEqual([])
      })
    })
  })
})
