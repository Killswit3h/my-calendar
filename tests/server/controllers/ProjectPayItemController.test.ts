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
  createValidInput: () => ({
    project_id: 1,
    pay_item_id: 1,
    contracted_quantity: new Prisma.Decimal(100.0),
    unit_rate: new Prisma.Decimal(50.0),
  } as any),
  createInvalidInput: () => ({
    project_id: 1,
    pay_item_id: 1,
    contracted_quantity: -10, // Invalid: negative
    unit_rate: 50.0,
  } as any),
  createUpdateInput: () => ({
    status: "ACTIVE",
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    // Ensure project and pay_item exist
    ;(mockPrisma as any).addProject({ id: data.project_id ?? 1 })
    ;(mockPrisma as any).addPayItem({ id: data.pay_item_id ?? 1 })
    
    return (mockPrisma as any).addProjectPayItem({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      project_id: data.project_id ?? 1,
      pay_item_id: data.pay_item_id ?? 1,
      contracted_quantity: data.contracted_quantity ?? 100.0,
      unit_rate: data.unit_rate ?? 50.0,
      is_original: data.is_original ?? true,
      stockpile_billed: data.stockpile_billed ?? 0,
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithProject(mockPrisma)
    extendMockPrismaWithPayItem(mockPrisma)
    extendMockPrismaWithProjectPayItem(mockPrisma)
    // Ensure default FKs exist for create tests (project_id:1, pay_item_id:1)
    ;(mockPrisma as { addProject?: (d: { id?: number }) => void }).addProject?.({ id: 1 })
    ;(mockPrisma as { addPayItem?: (d: { id?: number }) => void }).addPayItem?.({ id: 1 })
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
        ;(mockPrisma as any).addProject({ id: 1 })
        ;(mockPrisma as any).addProject({ id: 2 })
        ;(mockPrisma as any).addPayItem({ id: 1 })
        ;(mockPrisma as any).addPayItem({ id: 2 })

        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 1,
          contracted_quantity: 100.0,
          unit_rate: 50.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 2,
          contracted_quantity: 200.0,
          unit_rate: 60.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 2,
          pay_item_id: 1,
          contracted_quantity: 150.0,
          unit_rate: 55.0,
        })

        const url = new URL("http://localhost:3000/api/project-pay-items?project_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(2)
        expect(data.every((item: any) => item.project_id === 1)).toBe(true)
      })

      it("should filter by pay_item_id query parameter", async () => {
        ;(mockPrisma as any).addProject({ id: 1 })
        ;(mockPrisma as any).addProject({ id: 2 })
        ;(mockPrisma as any).addPayItem({ id: 1 })
        ;(mockPrisma as any).addPayItem({ id: 2 })

        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 1,
          contracted_quantity: 100.0,
          unit_rate: 50.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 2,
          pay_item_id: 1,
          contracted_quantity: 200.0,
          unit_rate: 60.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 2,
          contracted_quantity: 150.0,
          unit_rate: 55.0,
        })

        const url = new URL("http://localhost:3000/api/project-pay-items?pay_item_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(2)
        expect(data.every((item: any) => item.pay_item_id === 1)).toBe(true)
      })

      it("should filter by both project_id and pay_item_id", async () => {
        ;(mockPrisma as any).addProject({ id: 1 })
        ;(mockPrisma as any).addProject({ id: 2 })
        ;(mockPrisma as any).addPayItem({ id: 1 })
        ;(mockPrisma as any).addPayItem({ id: 2 })

        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 1,
          contracted_quantity: 100.0,
          unit_rate: 50.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 2,
          contracted_quantity: 200.0,
          unit_rate: 60.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 2,
          pay_item_id: 1,
          contracted_quantity: 150.0,
          unit_rate: 55.0,
        })

        const url = new URL("http://localhost:3000/api/project-pay-items?project_id=1&pay_item_id=1")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(1)
        expect(data[0].project_id).toBe(1)
        expect(data[0].pay_item_id).toBe(1)
      })
    })
  })
})
