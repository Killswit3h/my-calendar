import { describe, it, expect, beforeEach } from "vitest"
import { ScopeOfWorkService } from "@/server/services/ScopeOfWorkService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithScopeOfWork } from "../../utils/mockPrismaScopeOfWork"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { ValidationError, ConflictError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract service tests with ScopeOfWork configuration
const abstractTests = createAbstractServiceTests<
  ScopeOfWorkService,
  PrismaTypes.scope_of_workGetPayload<{}>,
  PrismaTypes.scope_of_workCreateInput,
  PrismaTypes.scope_of_workUpdateInput
>({
  serviceClass: ScopeOfWorkService,
  modelName: "scope_of_work",
  createValidInput: () => ({
    description: "Test Scope of Work",
  }),
  createInvalidInput: () =>
    ({
      description: "", // Invalid: empty description
    } as any),
  createUpdateInput: () => ({
    description: "Updated Scope of Work",
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addScopeOfWork({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      description: data.description ?? "Test Scope of Work",
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: extendMockPrismaWithScopeOfWork,
})

// Run abstract tests
describe("ScopeOfWorkService", () => {
  // Execute all abstract service tests
  abstractTests()

  // ScopeOfWork-specific custom business logic tests
  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: ScopeOfWorkService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithScopeOfWork(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new ScopeOfWorkService()
    })

    describe("validation", () => {
      it("should require description on create", async () => {
        await expect(
          service.create({
            description: undefined,
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should reject empty description", async () => {
        await expect(
          service.create({
            description: "",
          })
        ).rejects.toThrow(ValidationError)
      })

      it("should reject whitespace-only description", async () => {
        await expect(
          service.create({
            description: "   ",
          })
        ).rejects.toThrow(ValidationError)
      })

      it("should reject description longer than 255 characters", async () => {
        const longDescription = "a".repeat(256)
        await expect(
          service.create({
            description: longDescription,
          })
        ).rejects.toThrow(ValidationError)
      })

      it("should accept description of exactly 255 characters", async () => {
        const description = "a".repeat(255)
        const result = await service.create({
          description,
        })
        expect(result.description).toBe(description)
      })

      it("should trim description on create", async () => {
        const result = await service.create({
          description: "  Trimmed Description  ",
        })
        expect(result.description).toBe("Trimmed Description")
      })

      it("should allow description update", async () => {
        const scope = (mockPrisma as any).addScopeOfWork({
          description: "Original Description",
        })

        const result = await service.update(scope.id, {
          description: "Updated Description",
        })
        expect(result.description).toBe("Updated Description")
      })

      it("should trim description on update", async () => {
        const scope = (mockPrisma as any).addScopeOfWork({
          description: "Original Description",
        })

        const result = await service.update(scope.id, {
          description: "  Trimmed Update  ",
        })
        expect(result.description).toBe("Trimmed Update")
      })
    })

    describe("description uniqueness", () => {
      it("should prevent duplicate descriptions on create", async () => {
        ;(mockPrisma as any).addScopeOfWork({
          description: "Existing Scope",
        })

        await expect(
          service.create({
            description: "Existing Scope",
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should allow same description when updating same scope", async () => {
        const scope = (mockPrisma as any).addScopeOfWork({
          description: "Original Description",
        })

        const result = await service.update(scope.id, {
          description: "Original Description", // Same description, same scope
        })

        expect(result.description).toBe("Original Description")
      })

      it("should prevent duplicate descriptions when updating different scope", async () => {
        ;(mockPrisma as any).addScopeOfWork({
          id: 1,
          description: "First Scope",
        })
        ;(mockPrisma as any).addScopeOfWork({
          id: 2,
          description: "Second Scope",
        })

        await expect(
          service.update(2, {
            description: "First Scope", // Trying to use scope 1's description
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should handle case-sensitive uniqueness check", async () => {
        ;(mockPrisma as any).addScopeOfWork({
          description: "Case Sensitive",
        })

        // Should allow different case (exact match required)
        const result = await service.create({
          description: "case sensitive",
        })
        expect(result.description).toBe("case sensitive")
      })
    })
  })
})
