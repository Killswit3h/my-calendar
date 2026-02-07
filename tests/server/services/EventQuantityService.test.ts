import { describe, it, expect, beforeEach } from "vitest"
import { EventQuantityService } from "@/server/services/EventQuantityService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEventQuantity } from "../../utils/mockPrismaEventQuantity"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { ValidationError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

// Run the abstract service tests with EventQuantity configuration
const abstractTests = createAbstractServiceTests<
  EventQuantityService,
  PrismaTypes.event_quantityGetPayload<{}>,
  PrismaTypes.event_quantityCreateInput,
  PrismaTypes.event_quantityUpdateInput
>({
  serviceClass: EventQuantityService,
  modelName: "event_quantity",
  createValidInput: () => ({
    event_id: 1,
    project_pay_item_id: 1,
    quantity: new Prisma.Decimal(100.0),
  } as any),
  createInvalidInput: () =>
    ({
      event_id: 1,
      project_pay_item_id: 1,
      quantity: -10, // Invalid: negative
    } as any),
  createUpdateInput: () => ({
    notes: "Updated notes",
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    // Ensure event and project_pay_item exist
    ;(mockPrisma as any).addEvent({ id: data.event_id ?? 1 })
    ;(mockPrisma as any).addProjectPayItem({ id: data.project_pay_item_id ?? 1 })
    
    return (mockPrisma as any).addEventQuantity({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      event_id: data.event_id ?? 1,
      project_pay_item_id: data.project_pay_item_id ?? 1,
      quantity: data.quantity ?? 100.0,
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithEventQuantity(mockPrisma)
    // Ensure default FKs exist for create tests (event_id:1, project_pay_item_id:1)
    ;(mockPrisma as { addEvent?: (d: { id?: number }) => void }).addEvent?.({ id: 1 })
    ;(mockPrisma as { addProjectPayItem?: (d: { id?: number }) => void }).addProjectPayItem?.({ id: 1 })
  },
})

// Run abstract tests
describe("EventQuantityService", () => {
  // Execute all abstract service tests
  abstractTests()

  // EventQuantity-specific custom business logic tests
  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: EventQuantityService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithEventQuantity(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new EventQuantityService()
    })

    describe("validation", () => {
      describe("event_id validation", () => {
        it("should require event_id on create", async () => {
          ;(mockPrisma as any).addProjectPayItem({ id: 1 })
          await expect(
            service.create({
              project_pay_item_id: 1,
              quantity: 100.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should validate event exists", async () => {
          ;(mockPrisma as any).addProjectPayItem({ id: 1 })
          await expect(
            service.create({
              event_id: 999,
              project_pay_item_id: 1,
              quantity: 100.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })
      })

      describe("project_pay_item_id validation", () => {
        it("should require project_pay_item_id on create", async () => {
          ;(mockPrisma as any).addEvent({ id: 1 })
          await expect(
            service.create({
              event_id: 1,
              quantity: 100.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should validate project_pay_item exists", async () => {
          ;(mockPrisma as any).addEvent({ id: 1 })
          await expect(
            service.create({
              event_id: 1,
              project_pay_item_id: 999,
              quantity: 100.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })
      })

      describe("quantity validation", () => {
        it("should require quantity on create", async () => {
          ;(mockPrisma as any).addEvent({ id: 1 })
          ;(mockPrisma as any).addProjectPayItem({ id: 1 })
          await expect(
            service.create({
              event_id: 1,
              project_pay_item_id: 1,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should reject negative quantity", async () => {
          ;(mockPrisma as any).addEvent({ id: 1 })
          ;(mockPrisma as any).addProjectPayItem({ id: 1 })
          await expect(
            service.create({
              event_id: 1,
              project_pay_item_id: 1,
              quantity: -10,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should accept zero quantity", async () => {
          ;(mockPrisma as any).addEvent({ id: 1 })
          ;(mockPrisma as any).addProjectPayItem({ id: 1 })
          const result = await service.create({
            event_id: 1,
            project_pay_item_id: 1,
            quantity: 0,
          } as any)
          expect(result).toBeTruthy()
        })
      })
    })
  })
})
