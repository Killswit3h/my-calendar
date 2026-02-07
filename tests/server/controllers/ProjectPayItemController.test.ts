import { describe, it, expect, beforeEach } from "vitest"
import { ProjectPayItemController } from "@/server/controllers/ProjectPayItemController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithProjectPayItem } from "../../utils/mockPrismaProjectPayItem"
import { extendMockPrismaWithProject } from "../../utils/mockPrismaProject"
import { extendMockPrismaWithPayItem } from "../../utils/mockPrismaPayItem"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

type ProjectPayItemCreateLike =
  | PrismaTypes.project_pay_itemCreateInput
  | {
      project_id?: number
      pay_item_id?: number
      id?: number
      contracted_quantity?: number | Prisma.Decimal
      unit_rate?: number | Prisma.Decimal
      is_original?: boolean
      stockpile_billed?: number | Prisma.Decimal
    }

type MockPrismaProjectPayItem = MockPrisma & {
  addProject?: (d: { id?: number }) => void
  addPayItem?: (d: { id?: number }) => void
  addProjectPayItem?: (d: {
    id?: number
    project_id?: number
    pay_item_id?: number
    contracted_quantity?: number | Prisma.Decimal
    unit_rate?: number | Prisma.Decimal
    is_original?: boolean
    stockpile_billed?: number | Prisma.Decimal
  }) => PrismaTypes.project_pay_itemGetPayload<{}>
}

// Run the abstract controller tests with ProjectPayItem configuration
const abstractTests = createAbstractControllerTests<
  ProjectPayItemController,
  PrismaTypes.project_pay_itemGetPayload<{}>,
  PrismaTypes.project_pay_itemCreateInput,
  PrismaTypes.project_pay_itemUpdateInput
>({
  controllerClass: ProjectPayItemController,
  modelName: "project_pay_item",
  apiPath: "/api/project-pay-items",
  createValidInput: (): PrismaTypes.project_pay_itemCreateInput => ({
    project: { connect: { id: 1 } },
    pay_item: { connect: { id: 1 } },
    contracted_quantity: new Prisma.Decimal(100.0),
    unit_rate: new Prisma.Decimal(50.0),
  }),
  createInvalidInput: (): PrismaTypes.project_pay_itemCreateInput => ({
    project: { connect: { id: 1 } },
    pay_item: { connect: { id: 1 } },
    contracted_quantity: -10, // Invalid: negative
    unit_rate: new Prisma.Decimal(50.0),
  }),
  createUpdateInput: () => ({
    status: "ACTIVE",
  }),
  addMockRecord: (
    mockPrisma: MockPrisma,
    data: ProjectPayItemCreateLike
  ): PrismaTypes.project_pay_itemGetPayload<{}> => {
    const ext = mockPrisma as MockPrismaProjectPayItem
    const projectId =
      "project_id" in data && data.project_id !== undefined
        ? data.project_id
        : data.project && typeof data.project === "object" && "connect" in data.project
          ? (data.project.connect as { id: number }).id
          : 1
    const payItemId =
      "pay_item_id" in data && data.pay_item_id !== undefined
        ? data.pay_item_id
        : data.pay_item && typeof data.pay_item === "object" && "connect" in data.pay_item
          ? (data.pay_item.connect as { id: number }).id
          : 1
    ext.addProject?.({ id: projectId })
    ext.addPayItem?.({ id: payItemId })
    return ext.addProjectPayItem!({
      id: "id" in data ? data.id : undefined,
      project_id: projectId,
      pay_item_id: payItemId,
      contracted_quantity: "contracted_quantity" in data ? data.contracted_quantity : 100.0,
      unit_rate: "unit_rate" in data ? data.unit_rate : 50.0,
      is_original: "is_original" in data ? data.is_original : true,
      stockpile_billed: "stockpile_billed" in data ? data.stockpile_billed : 0,
    })
  },
  getIdFromModel: (model: PrismaTypes.project_pay_itemGetPayload<{}>) => model.id,
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithProject(mockPrisma)
    extendMockPrismaWithPayItem(mockPrisma)
    extendMockPrismaWithProjectPayItem(mockPrisma)
    const ext = mockPrisma as MockPrismaProjectPayItem
    ext.addProject?.({ id: 1 })
    ext.addPayItem?.({ id: 1 })
  },
})

// Run abstract tests
describe("ProjectPayItemController", () => {
  // Execute all abstract controller tests
  abstractTests()

  // ProjectPayItem-specific controller tests
  describe("Custom Controller Behavior", () => {
    let mockPrisma: MockPrisma
    let controller: ProjectPayItemController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithProject(mockPrisma)
      extendMockPrismaWithPayItem(mockPrisma)
      extendMockPrismaWithProjectPayItem(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new ProjectPayItemController()
    })

    describe("handleGet - filtering", () => {
      it("should filter by project_id query parameter", async () => {
        const ext = mockPrisma as MockPrismaProjectPayItem
        ext.addProject?.({ id: 1 })
        ext.addProject?.({ id: 2 })
        ext.addPayItem?.({ id: 1 })
        ext.addPayItem?.({ id: 2 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 1, contracted_quantity: 100.0, unit_rate: 50.0 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 2, contracted_quantity: 200.0, unit_rate: 60.0 })
        ext.addProjectPayItem?.({ project_id: 2, pay_item_id: 1, contracted_quantity: 150.0, unit_rate: 55.0 })

        const url = new URL("http://localhost:3000/api/project-pay-items?project_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = (await response.json()) as PrismaTypes.project_pay_itemGetPayload<{}>[]
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(2)
        expect(data.every((item) => item.project_id === 1)).toBe(true)
      })

      it("should filter by pay_item_id query parameter", async () => {
        const ext = mockPrisma as MockPrismaProjectPayItem
        ext.addProject?.({ id: 1 })
        ext.addProject?.({ id: 2 })
        ext.addPayItem?.({ id: 1 })
        ext.addPayItem?.({ id: 2 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 1, contracted_quantity: 100.0, unit_rate: 50.0 })
        ext.addProjectPayItem?.({ project_id: 2, pay_item_id: 1, contracted_quantity: 200.0, unit_rate: 60.0 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 2, contracted_quantity: 150.0, unit_rate: 55.0 })

        const url = new URL("http://localhost:3000/api/project-pay-items?pay_item_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = (await response.json()) as PrismaTypes.project_pay_itemGetPayload<{}>[]
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(2)
        expect(data.every((item) => item.pay_item_id === 1)).toBe(true)
      })

      it("should filter by both project_id and pay_item_id", async () => {
        const ext = mockPrisma as MockPrismaProjectPayItem
        ext.addProject?.({ id: 1 })
        ext.addProject?.({ id: 2 })
        ext.addPayItem?.({ id: 1 })
        ext.addPayItem?.({ id: 2 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 1, contracted_quantity: 100.0, unit_rate: 50.0 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 2, contracted_quantity: 200.0, unit_rate: 60.0 })
        ext.addProjectPayItem?.({ project_id: 2, pay_item_id: 1, contracted_quantity: 150.0, unit_rate: 55.0 })

        const url = new URL("http://localhost:3000/api/project-pay-items?project_id=1&pay_item_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = (await response.json()) as PrismaTypes.project_pay_itemGetPayload<{}>[]
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(1)
        expect(data[0].project_id).toBe(1)
        expect(data[0].pay_item_id).toBe(1)
      })
    })
  })
})
