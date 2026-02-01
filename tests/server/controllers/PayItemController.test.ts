import { describe, it, expect, beforeEach } from "vitest"
import { PayItemController } from "@/server/controllers/PayItemController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithPayItem } from "../../utils/mockPrismaPayItem"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract controller tests with PayItem configuration
const abstractTests = createAbstractControllerTests<
  PayItemController,
  PrismaTypes.pay_itemGetPayload<{}>,
  PrismaTypes.pay_itemCreateInput,
  PrismaTypes.pay_itemUpdateInput
>({
  controllerClass: PayItemController,
  modelName: "pay_item",
  apiPath: "/api/pay-items",
  createValidInput: () => ({
    number: "123-456",
    description: "Test Pay Item",
    unit: "EA",
  }),
  createInvalidInput: () => ({
    number: "", // Invalid: empty number
    description: "Test",
    unit: "EA",
  }),
  createUpdateInput: () => ({
    description: "Updated Pay Item",
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addPayItem({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      number: data.number ?? "123-456",
      description: data.description ?? "Test Pay Item",
      unit: data.unit ?? "EA",
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: extendMockPrismaWithPayItem,
})

// Run abstract tests
describe("PayItemController", () => {
  // Execute all abstract controller tests
  abstractTests()

  // PayItem-specific controller tests
  describe("Custom Controller Behavior", () => {
    let mockPrisma: MockPrisma
    let controller: PayItemController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithPayItem(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new PayItemController()
    })

    describe("handleGet - filtering", () => {
      it("should filter by number query parameter", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "123-456",
          description: "Item 1",
          unit: "EA",
        })
        ;(mockPrisma as any).addPayItem({
          number: "789-012",
          description: "Item 2",
          unit: "FT",
        })
        ;(mockPrisma as any).addPayItem({
          number: "123-789",
          description: "Item 3",
          unit: "YD",
        })

        const url = new URL("http://localhost:3000/api/pay-items?number=123")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
        expect(data.every((item: any) => 
          item.number.toLowerCase().includes("123")
        )).toBe(true)
      })

      it("should filter by description query parameter", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "001",
          description: "Concrete Work",
          unit: "CY",
        })
        ;(mockPrisma as any).addPayItem({
          number: "002",
          description: "Excavation Work",
          unit: "CY",
        })
        ;(mockPrisma as any).addPayItem({
          number: "003",
          description: "Concrete Finishing",
          unit: "SF",
        })

        const url = new URL("http://localhost:3000/api/pay-items?description=Concrete")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
        expect(data.every((item: any) => 
          item.description.toLowerCase().includes("concrete")
        )).toBe(true)
      })

      it("should filter by both number and description", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "123-456",
          description: "Concrete Work",
          unit: "CY",
        })
        ;(mockPrisma as any).addPayItem({
          number: "123-789",
          description: "Excavation Work",
          unit: "CY",
        })
        ;(mockPrisma as any).addPayItem({
          number: "999-999",
          description: "Concrete Finishing",
          unit: "SF",
        })

        const url = new URL("http://localhost:3000/api/pay-items?number=123&description=Concrete")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
        expect(data[0].number).toContain("123")
        expect(data[0].description.toLowerCase()).toContain("concrete")
      })

      it("should return empty array when no matches found", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "123-456",
          description: "Test Item",
          unit: "EA",
        })

        const url = new URL("http://localhost:3000/api/pay-items?number=Nonexistent")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(0)
      })

      it("should return all pay items when no filter provided", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "001",
          description: "Item 1",
          unit: "EA",
        })
        ;(mockPrisma as any).addPayItem({
          number: "002",
          description: "Item 2",
          unit: "FT",
        })

        const url = new URL("http://localhost:3000/api/pay-items")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
      })
    })

    describe("handleGet - by ID", () => {
      it("should return 404 when pay item not found", async () => {
        const url = new URL("http://localhost:3000/api/pay-items/999")
        const req = new NextRequest(url)
        const context = { params: Promise.resolve({ id: "999" }) }
        const response = await controller.handleGet(req, context)

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data.error).toBeDefined()
      })

      it("should return pay item when found by ID", async () => {
        const payItem = (mockPrisma as any).addPayItem({
          number: "123-456",
          description: "Test Item",
          unit: "EA",
        })

        const url = new URL(`http://localhost:3000/api/pay-items/${payItem.id}`)
        const req = new NextRequest(url)
        const context = { params: Promise.resolve({ id: String(payItem.id) }) }
        const response = await controller.handleGet(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.id).toBe(payItem.id)
        expect(data.number).toBe("123-456")
        expect(data.description).toBe("Test Item")
        expect(data.unit).toBe("EA")
      })
    })

    describe("handlePost - conflict handling", () => {
      it("should return 409 when number already exists", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "123-456",
          description: "Existing Item",
          unit: "EA",
        })

        const url = new URL("http://localhost:3000/api/pay-items")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ 
            number: "123-456",
            description: "New Item",
            unit: "FT",
          }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })

      it("should return 409 when number already exists (case-insensitive)", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "ABC-123",
          description: "Existing Item",
          unit: "EA",
        })

        const url = new URL("http://localhost:3000/api/pay-items")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ 
            number: "abc-123",
            description: "New Item",
            unit: "FT",
          }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })
    })

    describe("handlePatch - conflict handling", () => {
      it("should return 409 when updating to existing number", async () => {
        ;(mockPrisma as any).addPayItem({
          id: 1,
          number: "123-456",
          description: "First Item",
          unit: "EA",
        })
        const item2 = (mockPrisma as any).addPayItem({
          id: 2,
          number: "789-012",
          description: "Second Item",
          unit: "FT",
        })

        const url = new URL(`http://localhost:3000/api/pay-items/${item2.id}`)
        const req = new NextRequest(url, {
          method: "PATCH",
          body: JSON.stringify({ 
            number: "123-456",
          }),
        })
        const context = { params: Promise.resolve({ id: String(item2.id) }) }
        const response = await controller.handlePatch(req, context)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })
    })

    describe("handleDelete", () => {
      it("should return 200 on successful deletion", async () => {
        const payItem = (mockPrisma as any).addPayItem({
          number: "123-456",
          description: "To Be Deleted",
          unit: "EA",
        })

        const url = new URL(`http://localhost:3000/api/pay-items/${payItem.id}`)
        const req = new NextRequest(url, { method: "DELETE" })
        const context = { params: Promise.resolve({ id: String(payItem.id) }) }
        const response = await controller.handleDelete(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.message).toBeDefined()
      })
    })
  })
})
