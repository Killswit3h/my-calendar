import { describe, it, expect, beforeEach } from "vitest"
import { ScopeOfWorkRepository } from "@/server/repositories/ScopeOfWorkRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithScopeOfWork } from "../../utils/mockPrismaScopeOfWork"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract repository tests with ScopeOfWork configuration
const abstractTests = createAbstractRepositoryTests<
  ScopeOfWorkRepository,
  PrismaTypes.scope_of_workGetPayload<{}>,
  PrismaTypes.scope_of_workCreateInput,
  PrismaTypes.scope_of_workUpdateInput,
  PrismaTypes.scope_of_workWhereUniqueInput,
  PrismaTypes.scope_of_workWhereInput
>({
  repositoryClass: ScopeOfWorkRepository,
  modelName: "scope_of_work",
  createValidInput: () => ({
    description: "Test Scope of Work",
  }),
  createUpdateInput: () => ({
    description: "Updated Scope of Work",
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: Record<string, any>) => filters as any,
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addScopeOfWork({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      description: data.description ?? "Test Scope of Work",
    })
  },
  getIdFromModel: (model: any) => model.id,
  idField: "id",
  extendMockPrisma: extendMockPrismaWithScopeOfWork,
})

// Run abstract tests
describe("ScopeOfWorkRepository", () => {
  // Execute all abstract repository tests
  abstractTests()

  // ScopeOfWork-specific custom method tests
  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: ScopeOfWorkRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithScopeOfWork(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new ScopeOfWorkRepository()
    })

    describe("findByDescription", () => {
      it("should find scope of work by description", async () => {
        ;(mockPrisma as any).addScopeOfWork({
          description: "Excavation Work",
        })
        ;(mockPrisma as any).addScopeOfWork({
          description: "Concrete Pouring",
        })

        const result = await repository.findByDescription("Excavation Work")
        expect(result).toBeTruthy()
        expect(result?.description).toBe("Excavation Work")
      })

      it("should return null when description not found", async () => {
        const result = await repository.findByDescription("Nonexistent Work")
        expect(result).toBeNull()
      })

      it("should handle exact match", async () => {
        ;(mockPrisma as any).addScopeOfWork({
          description: "Exact Match Work",
        })

        const result = await repository.findByDescription("Exact Match Work")
        expect(result).toBeTruthy()

        const noMatch = await repository.findByDescription("exact match work")
        expect(noMatch).toBeNull()
      })
    })

    describe("findByIds", () => {
      it("should find multiple scopes by IDs", async () => {
        const scope1 = (mockPrisma as any).addScopeOfWork({
          description: "Scope 1",
        })
        const scope2 = (mockPrisma as any).addScopeOfWork({
          description: "Scope 2",
        })
        ;(mockPrisma as any).addScopeOfWork({
          description: "Scope 3",
        })

        const results = await repository.findByIds([scope1.id, scope2.id])
        expect(results).toHaveLength(2)
        expect(results.map((r) => r.id).sort()).toEqual([scope1.id, scope2.id].sort())
      })

      it("should return empty array when no IDs match", async () => {
        const results = await repository.findByIds([999, 1000])
        expect(results).toHaveLength(0)
      })

      it("should return partial results when some IDs match", async () => {
        const scope1 = (mockPrisma as any).addScopeOfWork({
          description: "Scope 1",
        })

        const results = await repository.findByIds([scope1.id, 999])
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe(scope1.id)
      })
    })
  })
})
