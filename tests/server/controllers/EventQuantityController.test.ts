import { describe, it, expect, beforeEach } from "vitest"
import { EventQuantityController } from "@/server/controllers/EventQuantityController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEventQuantity } from "../../utils/mockPrismaEventQuantity"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

// Run the abstract controller tests with EventQuantity configuration
const abstractTests = createAbstractControllerTests<
  EventQuantityController,
  PrismaTypes.event_quantityGetPayload<{}>,
  PrismaTypes.event_quantityCreateInput,
  PrismaTypes.event_quantityUpdateInput
>({
  controllerClass: EventQuantityController,
  modelName: "event_quantity",
  apiPath: "/api/event-quantities",
  createValidInput: () => ({
    event_id: 1,
    project_pay_item_id: 1,
    quantity: new Prisma.Decimal(100.0),
  } as any),
  createInvalidInput: () => ({
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
describe("EventQuantityController", () => {
  // Execute all abstract controller tests
  abstractTests()

  // EventQuantity-specific controller tests
  describe("Custom Controller Behavior", () => {
    let mockPrisma: MockPrisma
    let controller: EventQuantityController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithEventQuantity(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new EventQuantityController()
    })

    describe("handleGet - filtering", () => {
      it("should filter by event_id", async () => {
        ;(mockPrisma as any).addEvent({ id: 1 })
        ;(mockPrisma as any).addEvent({ id: 2 })
        ;(mockPrisma as any).addProjectPayItem({ id: 1 })

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

        const url = new URL("http://localhost:3000/api/event-quantities?event_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.every((item: any) => item.event_id === 1)).toBe(true)
      })

      it("should filter by project_pay_item_id", async () => {
        ;(mockPrisma as any).addEvent({ id: 1 })
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

        const url = new URL("http://localhost:3000/api/event-quantities?project_pay_item_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.every((item: any) => item.project_pay_item_id === 1)).toBe(true)
      })
    })
  })
})
