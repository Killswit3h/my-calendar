import { describe, it, expect, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { CustomerController } from "@/server/controllers/CustomerController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithCustomer } from "../../utils/mockPrismaCustomer"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract controller tests with Customer configuration
const abstractTests = createAbstractControllerTests<
  CustomerController,
  PrismaTypes.customerGetPayload<{}>,
  PrismaTypes.customerCreateInput,
  PrismaTypes.customerUpdateInput
>({
  controllerClass: CustomerController,
  modelName: "customer",
  apiPath: "/api/customers",
  createValidInput: () => ({
    name: "Test Customer",
    address: "123 Main St",
    phone_number: "555-1234",
    email: "test@example.com",
  }),
  createInvalidInput: () => ({
    name: "", // Invalid: empty name
    address: "123 Main St",
    phone_number: "555-1234",
    email: "test@example.com",
  }),
  createUpdateInput: () => ({
    name: "Updated Customer",
    address: "456 Oak Ave",
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addCustomer({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      name: data.name ?? "Test Customer",
      address: data.address ?? "123 Main St",
      phone_number: data.phone_number ?? "555-1234",
      email: data.email ?? "test@example.com",
      notes: data.notes ?? null,
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: extendMockPrismaWithCustomer,
})

// Run abstract tests
describe("CustomerController", () => {
  // Execute all abstract controller tests
  abstractTests()

  // Customer-specific custom controller tests
  describe("Custom Controller Logic", () => {
    let mockPrisma: MockPrisma
    let controller: CustomerController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithCustomer(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new CustomerController()
    })

    describe("handleGet - search query", () => {
      it("should filter customers by search query parameter", async () => {
        ;(mockPrisma as any).addCustomer({
          name: "John Doe",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "john@example.com",
        })
        ;(mockPrisma as any).addCustomer({
          name: "Jane Smith",
          address: "456 Oak Ave",
          phone_number: "555-5678",
          email: "jane@example.com",
        })

        const url = new URL("http://localhost:3000/api/customers?search=john")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
        expect(data.some((c: any) => c.name === "John Doe")).toBe(true)
      })

      it("should return all customers when no search query", async () => {
        ;(mockPrisma as any).addCustomer({
          name: "John Doe",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "john@example.com",
        })
        ;(mockPrisma as any).addCustomer({
          name: "Jane Smith",
          address: "456 Oak Ave",
          phone_number: "555-5678",
          email: "jane@example.com",
        })

        const url = new URL("http://localhost:3000/api/customers")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
      })
    })
  })
})
