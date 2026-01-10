import { describe, it, expect, beforeEach } from "vitest"
import { PaymentTypeController } from "@/server/controllers/PaymentTypeController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithPaymentType } from "../../utils/mockPrismaPaymentType"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract controller tests with PaymentType configuration
const abstractTests = createAbstractControllerTests<
  PaymentTypeController,
  PrismaTypes.payment_typeGetPayload<{}>,
  PrismaTypes.payment_typeCreateInput,
  PrismaTypes.payment_typeUpdateInput
>({
  controllerClass: PaymentTypeController,
  modelName: "payment_type",
  apiPath: "/api/payment-types",
  createValidInput: () => ({
    description: "Test Payment Type",
  }),
  createInvalidInput: () => ({
    description: "", // Invalid: empty description
  }),
  createUpdateInput: () => ({
    description: "Updated Payment Type",
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addPaymentType({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      description: data.description ?? "Test Payment Type",
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: extendMockPrismaWithPaymentType,
})

// Run abstract tests
describe("PaymentTypeController", () => {
  // Execute all abstract controller tests
  abstractTests()

  // PaymentType-specific controller tests
  describe("Custom Controller Behavior", () => {
    let mockPrisma: MockPrisma
    let controller: PaymentTypeController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithPaymentType(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new PaymentTypeController()
    })

    describe("handleGet - filtering", () => {
      it("should filter by description query parameter", async () => {
        ;(mockPrisma as any).addPaymentType({
          description: "Cash Payment",
        })
        ;(mockPrisma as any).addPaymentType({
          description: "Credit Card Payment",
        })
        ;(mockPrisma as any).addPaymentType({
          description: "Cash and Check Payment",
        })

        const url = new URL("http://localhost:3000/api/payment-types?description=Cash")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
        expect(data.every((item: any) => 
          item.description.toLowerCase().includes("cash")
        )).toBe(true)
      })

      it("should return empty array when no matches found", async () => {
        ;(mockPrisma as any).addPaymentType({
          description: "Cash Payment",
        })

        const url = new URL("http://localhost:3000/api/payment-types?description=Nonexistent")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(0)
      })

      it("should return all payment types when no filter provided", async () => {
        ;(mockPrisma as any).addPaymentType({
          description: "Type 1",
        })
        ;(mockPrisma as any).addPaymentType({
          description: "Type 2",
        })

        const url = new URL("http://localhost:3000/api/payment-types")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
      })
    })

    describe("handleGet - by ID", () => {
      it("should return 404 when payment type not found", async () => {
        const url = new URL("http://localhost:3000/api/payment-types/999")
        const req = new NextRequest(url)
        const context = { params: Promise.resolve({ id: "999" }) }
        const response = await controller.handleGet(req, context)

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data.error).toBeDefined()
      })
    })

    describe("handlePost - conflict handling", () => {
      it("should return 409 when description already exists", async () => {
        ;(mockPrisma as any).addPaymentType({
          description: "Existing Payment Type",
        })

        const url = new URL("http://localhost:3000/api/payment-types")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ description: "Existing Payment Type" }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })
    })

    describe("handleDelete", () => {
      it("should return 200 on successful deletion", async () => {
        const paymentType = (mockPrisma as any).addPaymentType({
          description: "To Be Deleted",
        })

        const url = new URL(`http://localhost:3000/api/payment-types/${paymentType.id}`)
        const req = new NextRequest(url, { method: "DELETE" })
        const context = { params: Promise.resolve({ id: String(paymentType.id) }) }
        const response = await controller.handleDelete(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.message).toBeDefined()
      })
    })
  })
})
