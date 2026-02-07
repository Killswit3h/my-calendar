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
  createWhereInput: (filters: PrismaTypes.event_quantityWhereInput) => filters,
  addMockRecord: (
    mockPrisma: MockPrisma,
    data: PrismaTypes.event_quantityCreateInput | Partial<PrismaTypes.event_quantityGetPayload<{}>>
  ): PrismaTypes.event_quantityGetPayload<{}> => {
    type Ext = MockPrisma & {
      addEvent?: (d: { id?: number }) => void
      addProjectPayItem?: (d: { id?: number }) => void
      addEventQuantity?: (d: { id?: number; event_id?: number; project_pay_item_id?: number; quantity?: number | Prisma.Decimal }) => PrismaTypes.event_quantityGetPayload<{}>
    }
    const ext = mockPrisma as Ext
    const eventId = "event" in data && data.event && typeof data.event === "object" && "connect" in data.event ? (data.event.connect as { id: number }).id : (data as { event_id?: number }).event_id ?? 1
    const projectPayItemId = "project_pay_item" in data && data.project_pay_item && typeof data.project_pay_item === "object" && "connect" in data.project_pay_item ? (data.project_pay_item.connect as { id: number }).id : (data as { project_pay_item_id?: number }).project_pay_item_id ?? 1
    ext.addEvent?.({ id: eventId })
    ext.addProjectPayItem?.({ id: projectPayItemId })
    return ext.addEventQuantity!({
      id: "id" in data ? data.id : undefined,
      event_id: eventId,
      project_pay_item_id: projectPayItemId,
      quantity: "quantity" in data ? data.quantity : 100.0,
    })
  },
  getIdFromModel: (model: PrismaTypes.event_quantityGetPayload<{}>) => model.id,
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

    type Ext = MockPrisma & {
      addEvent?: (d: { id?: number }) => void
      addProjectPayItem?: (d: { id?: number }) => void
      addEventQuantity?: (d: { event_id?: number; project_pay_item_id?: number; quantity?: number }) => PrismaTypes.event_quantityGetPayload<{}>
    }

    describe("findByEventId", () => {
      it("should find event quantities by event ID", async () => {
        const ext = mockPrisma as Ext
        ext.addEvent?.({ id: 1 })
        ext.addEvent?.({ id: 2 })
        ext.addProjectPayItem?.({ id: 1 })
        ext.addProjectPayItem?.({ id: 2 })
        ext.addEventQuantity?.({ event_id: 1, project_pay_item_id: 1, quantity: 100.0 })
        ext.addEventQuantity?.({ event_id: 1, project_pay_item_id: 2, quantity: 200.0 })
        ext.addEventQuantity?.({ event_id: 2, project_pay_item_id: 1, quantity: 150.0 })

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
        const ext = mockPrisma as Ext
        ext.addEvent?.({ id: 1 })
        ext.addEvent?.({ id: 2 })
        ext.addProjectPayItem?.({ id: 1 })
        ext.addProjectPayItem?.({ id: 2 })
        ext.addEventQuantity?.({ event_id: 1, project_pay_item_id: 1, quantity: 100.0 })
        ext.addEventQuantity?.({ event_id: 2, project_pay_item_id: 1, quantity: 200.0 })
        ext.addEventQuantity?.({ event_id: 1, project_pay_item_id: 2, quantity: 150.0 })

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
