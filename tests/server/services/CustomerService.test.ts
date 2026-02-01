import { describe, it, expect, beforeEach } from "vitest"
import { CustomerService } from "@/server/services/CustomerService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithCustomer } from "../../utils/mockPrismaCustomer"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { ValidationError, ConflictError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract service tests with Customer configuration
const abstractTests = createAbstractServiceTests<
  CustomerService,
  PrismaTypes.customerGetPayload<{}>,
  PrismaTypes.customerCreateInput,
  PrismaTypes.customerUpdateInput
>({
  serviceClass: CustomerService,
  modelName: "customer",
  createValidInput: () => ({
    name: "Test Customer",
    address: "123 Main St",
    phone_number: "555-1234",
    email: "test@example.com",
  }),
  createInvalidInput: () =>
    ({
      name: "", // Invalid: empty name
      address: "123 Main St",
      phone_number: "555-1234",
      email: "test@example.com",
    } as any),
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
describe("CustomerService", () => {
  // Execute all abstract service tests
  abstractTests()

  // Customer-specific custom business logic tests
  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: CustomerService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithCustomer(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new CustomerService()
    })

    describe("validation", () => {
      it("should require name on create", async () => {
        await expect(
          service.create({
            address: "123 Main St",
            phone_number: "555-1234",
            email: "test@example.com",
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should require address on create", async () => {
        await expect(
          service.create({
            name: "John Doe",
            phone_number: "555-1234",
            email: "test@example.com",
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should require phone_number on create", async () => {
        await expect(
          service.create({
            name: "John Doe",
            address: "123 Main St",
            email: "test@example.com",
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should validate email format", async () => {
        await expect(
          service.create({
            name: "John Doe",
            address: "123 Main St",
            phone_number: "555-1234",
            email: "invalid-email", // Invalid format
          })
        ).rejects.toThrow(ValidationError)
      })

      it("should accept valid email format", async () => {
        const result = await service.create({
          name: "John Doe",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "john@example.com",
        })
        expect(result.email).toBe("john@example.com")
      })

      it("should trim whitespace from string fields", async () => {
        const result = await service.create({
          name: "  John Doe  ",
          address: "  123 Main St  ",
          phone_number: "  555-1234  ",
          email: "  john@example.com  ",
          notes: "  Some notes  ",
        })
        expect(result.name).toBe("John Doe")
        expect(result.address).toBe("123 Main St")
        expect(result.phone_number).toBe("555-1234")
        expect(result.email).toBe("john@example.com")
        expect(result.notes).toBe("Some notes")
      })

      it("should allow notes to be optional", async () => {
        const result = await service.create({
          name: "John Doe",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "john@example.com",
        })
        expect(result.notes).toBeNull()
      })
    })

    describe("email uniqueness", () => {
      it("should prevent duplicate emails on create", async () => {
        ;(mockPrisma as any).addCustomer({
          name: "Existing Customer",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "existing@example.com",
        })

        await expect(
          service.create({
            name: "New Customer",
            address: "456 Oak Ave",
            phone_number: "555-5678",
            email: "existing@example.com",
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should allow same email when updating same customer", async () => {
        ;(mockPrisma as any).addCustomer({
          id: 1,
          name: "John Doe",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "john@example.com",
        })

        const result = await service.update(1, {
          name: "John Updated",
          email: "john@example.com", // Same email, same customer
        })

        expect(result.email).toBe("john@example.com")
      })

      it("should prevent duplicate emails when updating different customer", async () => {
        ;(mockPrisma as any).addCustomer({
          id: 1,
          name: "John Doe",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "john@example.com",
        })
        ;(mockPrisma as any).addCustomer({
          id: 2,
          name: "Jane Smith",
          address: "456 Oak Ave",
          phone_number: "555-5678",
          email: "jane@example.com",
        })

        await expect(
          service.update(2, {
            email: "john@example.com", // Trying to use customer 1's email
          })
        ).rejects.toThrow(ConflictError)
      })
    })

    describe("mergeOrCreateByEmail", () => {
      it("should create new customer when email does not exist", async () => {
        const result = await service.mergeOrCreateByEmail({
          name: "New Customer",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "new@example.com",
        })

        expect(result).toBeTruthy()
        expect(result.email).toBe("new@example.com")
        expect(result.name).toBe("New Customer")
      })

      it("should update existing customer when email exists", async () => {
        ;(mockPrisma as any).addCustomer({
          id: 1,
          name: "Existing Customer",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "existing@example.com",
        })

        const result = await service.mergeOrCreateByEmail({
          name: "Updated Customer",
          address: "456 Oak Ave",
          phone_number: "555-5678",
          email: "existing@example.com",
        })

        expect(result.id).toBe(1)
        expect(result.email).toBe("existing@example.com")
        expect(result.name).toBe("Updated Customer")
        expect(result.address).toBe("456 Oak Ave")
      })

      it("should create customer when no email provided", async () => {
        const result = await service.mergeOrCreateByEmail({
          name: "Customer Without Email",
          address: "123 Main St",
          phone_number: "555-1234",
        } as any)

        expect(result).toBeTruthy()
        expect(result.name).toBe("Customer Without Email")
      })
    })
  })
})
