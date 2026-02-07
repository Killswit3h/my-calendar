import { describe, it, expect, beforeEach } from "vitest"
import { EventQuantityController } from "@/server/controllers/EventQuantityController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEventQuantity } from "../../utils/mockPrismaEventQuantity"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

type EventQuantityCreateLike = PrismaTypes.event_quantityCreateInput & {
  event_id?: number
  project_pay_item_id?: number
  id?: number
  quantity?: number | Prisma.Decimal
}

type MockPrismaEventQuantity = MockPrisma & {
  addEvent?: (d: { id?: number }) => void
  addProjectPayItem?: (d: { id?: number }) => void
  addEventQuantity?: (d: {
    id?: number
    event_id?: number
    project_pay_item_id?: number
    quantity?: number | Prisma.Decimal
  }) => PrismaTypes.event_quantityGetPayload<{}>
}

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
  createValidInput: (): PrismaTypes.event_quantityCreateInput => ({
    event: { connect: { id: 1 } },
    project_pay_item: { connect: { id: 1 } },
    quantity: new Prisma.Decimal(100.0),
  }),
  createInvalidInput: (): PrismaTypes.event_quantityCreateInput => ({
    event: { connect: { id: 1 } },
    project_pay_item: { connect: { id: 1 } },
    quantity: -10, // Invalid: negative
  }),
  createUpdateInput: () => ({
    notes: "Updated notes",
  }),
  addMockRecord: (
    mockPrisma: MockPrisma,
    data: EventQuantityCreateLike
  ): PrismaTypes.event_quantityGetPayload<{}> => {
    const ext = mockPrisma as MockPrismaEventQuantity
    const eventId =
      "event_id" in data && data.event_id !== undefined
        ? data.event_id
        : data.event && typeof data.event === "object" && "connect" in data.event
          ? (data.event.connect as { id: number }).id
          : 1
    const projectPayItemId =
      "project_pay_item_id" in data && data.project_pay_item_id !== undefined
        ? data.project_pay_item_id
        : data.project_pay_item && typeof data.project_pay_item === "object" && "connect" in data.project_pay_item
          ? (data.project_pay_item.connect as { id: number }).id
          : 1
    ext.addEvent?.({ id: eventId })
    ext.addProjectPayItem?.({ id: projectPayItemId })
    const q = data.quantity
    const quantity: number | Prisma.Decimal =
      q === undefined ? 100.0 : typeof q === "number" || q instanceof Prisma.Decimal ? q : 100.0
    return ext.addEventQuantity!({
      id: "id" in data ? data.id : undefined,
      event_id: eventId,
      project_pay_item_id: projectPayItemId,
      quantity,
    })
  },
  getIdFromModel: (model: PrismaTypes.event_quantityGetPayload<{}>) => model.id,
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithEventQuantity(mockPrisma)
    const ext = mockPrisma as MockPrismaEventQuantity
    ext.addEvent?.({ id: 1 })
    ext.addProjectPayItem?.({ id: 1 })
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
        const ext = mockPrisma as MockPrismaEventQuantity
        ext.addEvent?.({ id: 1 })
        ext.addEvent?.({ id: 2 })
        ext.addProjectPayItem?.({ id: 1 })
        ext.addEventQuantity?.({ event_id: 1, project_pay_item_id: 1, quantity: 100.0 })
        ext.addEventQuantity?.({ event_id: 2, project_pay_item_id: 1, quantity: 200.0 })

        const url = new URL("http://localhost:3000/api/event-quantities?event_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = (await response.json()) as PrismaTypes.event_quantityGetPayload<{}>[]
        expect(Array.isArray(data)).toBe(true)
        expect(data.every((item) => item.event_id === 1)).toBe(true)
      })

      it("should filter by project_pay_item_id", async () => {
        const ext = mockPrisma as MockPrismaEventQuantity
        ext.addEvent?.({ id: 1 })
        ext.addProjectPayItem?.({ id: 1 })
        ext.addProjectPayItem?.({ id: 2 })
        ext.addEventQuantity?.({ event_id: 1, project_pay_item_id: 1, quantity: 100.0 })
        ext.addEventQuantity?.({ event_id: 1, project_pay_item_id: 2, quantity: 200.0 })

        const url = new URL("http://localhost:3000/api/event-quantities?project_pay_item_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = (await response.json()) as PrismaTypes.event_quantityGetPayload<{}>[]
        expect(Array.isArray(data)).toBe(true)
        expect(data.every((item) => item.project_pay_item_id === 1)).toBe(true)
      })
    })
  })
})
