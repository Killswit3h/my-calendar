import { describe, it, expect, beforeEach } from "vitest"
import { PayItemRepository } from "@/server/repositories/PayItemRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithPayItem } from "../../utils/mockPrismaPayItem"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract repository tests with PayItem configuration
const abstractTests = createAbstractRepositoryTests<
  PayItemRepository,
  PrismaTypes.pay_itemGetPayload<{}>,
  PrismaTypes.pay_itemCreateInput,
  PrismaTypes.pay_itemUpdateInput,
  PrismaTypes.pay_itemWhereUniqueInput,
  PrismaTypes.pay_itemWhereInput
>({
  repositoryClass: PayItemRepository,
  modelName: "pay_item",
  createValidInput: () => ({
    number: "123-456",
    description: "Test Pay Item",
    unit: "EA",
  }),
  createUpdateInput: () => ({
    description: "Updated Pay Item",
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: Record<string, any>) => filters as any,
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addPayItem({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      number: data.number ?? "123-456",
      description: data.description ?? "Test Pay Item",
      unit: data.unit ?? "EA",
    })
  },
  getIdFromModel: (model: any) => model.id,
  idField: "id",
  extendMockPrisma: extendMockPrismaWithPayItem,
})

// Run abstract tests
describe("PayItemRepository", () => {
  // Execute all abstract repository tests
  abstractTests()

  // PayItem-specific custom method tests
  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: PayItemRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithPayItem(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new PayItemRepository()
    })

    describe("findByNumber", () => {
      it("should find pay item by number (case-insensitive)", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "123-456",
          description: "Test Item",
          unit: "EA",
        })
        ;(mockPrisma as any).addPayItem({
          number: "789-012",
          description: "Another Item",
          unit: "FT",
        })

        const result = await repository.findByNumber("123-456")
        expect(result).toBeTruthy()
        expect(result?.number).toBe("123-456")
        expect(result?.description).toBe("Test Item")
      })

      it("should return null when number not found", async () => {
        const result = await repository.findByNumber("Nonexistent")
        expect(result).toBeNull()
      })

      it("should handle case-insensitive matching", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "ABC-123",
          description: "Test Item",
          unit: "EA",
        })

        const result = await repository.findByNumber("abc-123")
        expect(result).toBeTruthy()
        expect(result?.number).toBe("ABC-123")
      })
    })

    describe("findByIds", () => {
      it("should find multiple pay items by IDs", async () => {
        const item1 = (mockPrisma as any).addPayItem({
          number: "001",
          description: "Item 1",
          unit: "EA",
        })
        const item2 = (mockPrisma as any).addPayItem({
          number: "002",
          description: "Item 2",
          unit: "FT",
        })
        ;(mockPrisma as any).addPayItem({
          number: "003",
          description: "Item 3",
          unit: "YD",
        })

        const results = await repository.findByIds([item1.id, item2.id])
        expect(results).toHaveLength(2)
        expect(results.map((r) => r.id).sort()).toEqual([item1.id, item2.id].sort())
      })

      it("should return empty array when no IDs match", async () => {
        const results = await repository.findByIds([999, 1000])
        expect(results).toHaveLength(0)
      })

      it("should return partial results when some IDs match", async () => {
        const item1 = (mockPrisma as any).addPayItem({
          number: "001",
          description: "Item 1",
          unit: "EA",
        })

        const results = await repository.findByIds([item1.id, 999])
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe(item1.id)
      })
    })
  })
})
