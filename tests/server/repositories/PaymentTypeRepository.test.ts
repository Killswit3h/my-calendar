import { describe, it, expect, beforeEach } from "vitest"
import { PaymentTypeRepository } from "@/server/repositories/PaymentTypeRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithPaymentType } from "../../utils/mockPrismaPaymentType"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract repository tests with PaymentType configuration
const abstractTests = createAbstractRepositoryTests<
  PaymentTypeRepository,
  PrismaTypes.payment_typeGetPayload<{}>,
  PrismaTypes.payment_typeCreateInput,
  PrismaTypes.payment_typeUpdateInput,
  PrismaTypes.payment_typeWhereUniqueInput,
  PrismaTypes.payment_typeWhereInput
>({
  repositoryClass: PaymentTypeRepository,
  modelName: "payment_type",
  createValidInput: () => ({
    description: "Test Payment Type",
  }),
  createUpdateInput: () => ({
    description: "Updated Payment Type",
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: Record<string, any>) => filters as any,
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addPaymentType({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      description: data.description ?? "Test Payment Type",
    })
  },
  getIdFromModel: (model: any) => model.id,
  idField: "id",
  extendMockPrisma: extendMockPrismaWithPaymentType,
})

// Run abstract tests
describe("PaymentTypeRepository", () => {
  // Execute all abstract repository tests
  abstractTests()

  // PaymentType-specific custom method tests
  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: PaymentTypeRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithPaymentType(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new PaymentTypeRepository()
    })

    describe("findByDescription", () => {
      it("should find payment type by description", async () => {
        ;(mockPrisma as any).addPaymentType({
          description: "Cash Payment",
        })
        ;(mockPrisma as any).addPaymentType({
          description: "Credit Card Payment",
        })

        const result = await repository.findByDescription("Cash Payment")
        expect(result).toBeTruthy()
        expect(result?.description).toBe("Cash Payment")
      })

      it("should return null when description not found", async () => {
        const result = await repository.findByDescription("Nonexistent Payment")
        expect(result).toBeNull()
      })

      it("should handle exact match", async () => {
        ;(mockPrisma as any).addPaymentType({
          description: "Exact Match Payment",
        })

        const result = await repository.findByDescription("Exact Match Payment")
        expect(result).toBeTruthy()

        const noMatch = await repository.findByDescription("exact match payment")
        expect(noMatch).toBeNull()
      })
    })

    describe("findByIds", () => {
      it("should find multiple payment types by IDs", async () => {
        const type1 = (mockPrisma as any).addPaymentType({
          description: "Type 1",
        })
        const type2 = (mockPrisma as any).addPaymentType({
          description: "Type 2",
        })
        ;(mockPrisma as any).addPaymentType({
          description: "Type 3",
        })

        const results = await repository.findByIds([type1.id, type2.id])
        expect(results).toHaveLength(2)
        expect(results.map((r) => r.id).sort()).toEqual([type1.id, type2.id].sort())
      })

      it("should return empty array when no IDs match", async () => {
        const results = await repository.findByIds([999, 1000])
        expect(results).toHaveLength(0)
      })

      it("should return partial results when some IDs match", async () => {
        const type1 = (mockPrisma as any).addPaymentType({
          description: "Type 1",
        })

        const results = await repository.findByIds([type1.id, 999])
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe(type1.id)
      })
    })
  })
})
