import { describe, it, expect, beforeEach } from "vitest"
import { CustomerRepository } from "@/server/repositories/CustomerRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithCustomer } from "../../utils/mockPrismaCustomer"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract repository tests with Customer configuration
const abstractTests = createAbstractRepositoryTests<
  CustomerRepository,
  PrismaTypes.customerGetPayload<{}>,
  PrismaTypes.customerCreateInput,
  PrismaTypes.customerUpdateInput,
  PrismaTypes.customerWhereUniqueInput,
  PrismaTypes.customerWhereInput
>({
  repositoryClass: CustomerRepository,
  modelName: "customer",
  createValidInput: () => ({
    name: "Test Customer",
    address: "123 Main St",
    phone_number: "555-1234",
    email: "test@example.com",
  }),
  createUpdateInput: () => ({
    name: "Updated Customer",
    address: "456 Oak Ave",
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: Record<string, any>) => filters as any,
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
  idField: "id",
  extendMockPrisma: extendMockPrismaWithCustomer,
})

// Run abstract tests
describe("CustomerRepository", () => {
  // Execute all abstract repository tests
  abstractTests()

  // Customer-specific custom method tests
  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: CustomerRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithCustomer(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new CustomerRepository()
    })

    describe("findByEmail", () => {
      it("should find customer by email", async () => {
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

        const result = await repository.findByEmail("john@example.com")
        expect(result).toBeTruthy()
        expect(result?.email).toBe("john@example.com")
        expect(result?.name).toBe("John Doe")
      })

      it("should return null when email not found", async () => {
        const result = await repository.findByEmail("nonexistent@example.com")
        expect(result).toBeNull()
      })

      it("should handle case sensitivity", async () => {
        ;(mockPrisma as any).addCustomer({
          name: "John Doe",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "John@Example.com",
        })

        // Email matching should be exact (case-sensitive by default in Prisma)
        const result = await repository.findByEmail("John@Example.com")
        expect(result).toBeTruthy()

        const noMatch = await repository.findByEmail("john@example.com")
        expect(noMatch).toBeNull()
      })
    })

    describe("searchByName", () => {
      it("should find customers by name (case-insensitive partial match)", async () => {
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
        ;(mockPrisma as any).addCustomer({
          name: "Johnny Appleseed",
          address: "789 Pine Rd",
          phone_number: "555-9999",
          email: "johnny@example.com",
        })

        const results = await repository.searchByName("john")
        expect(results.length).toBeGreaterThanOrEqual(2)
        expect(results.some((c) => c.name === "John Doe")).toBe(true)
        expect(results.some((c) => c.name === "Johnny Appleseed")).toBe(true)
        expect(results.some((c) => c.name === "Jane Smith")).toBe(false)
      })

      it("should return empty array when no matches found", async () => {
        ;(mockPrisma as any).addCustomer({
          name: "John Doe",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "john@example.com",
        })

        const results = await repository.searchByName("nonexistent")
        expect(results).toHaveLength(0)
      })

      it("should handle case-insensitive search", async () => {
        ;(mockPrisma as any).addCustomer({
          name: "John Doe",
          address: "123 Main St",
          phone_number: "555-1234",
          email: "john@example.com",
        })

        const results = await repository.searchByName("JOHN")
        expect(results.length).toBeGreaterThanOrEqual(1)
        expect(results[0].name).toBe("John Doe")
      })
    })
  })
})
