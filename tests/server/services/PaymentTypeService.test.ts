import { describe, it, expect, beforeEach } from "vitest"
import { PaymentTypeService } from "@/server/services/PaymentTypeService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithPaymentType } from "../../utils/mockPrismaPaymentType"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { ValidationError, ConflictError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract service tests with PaymentType configuration
const abstractTests = createAbstractServiceTests<
  PaymentTypeService,
  PrismaTypes.payment_typeGetPayload<{}>,
  PrismaTypes.payment_typeCreateInput,
  PrismaTypes.payment_typeUpdateInput
>({
  serviceClass: PaymentTypeService,
  modelName: "payment_type",
  createValidInput: () => ({
    description: "Test Payment Type",
  }),
  createInvalidInput: () =>
    ({
      description: "", // Invalid: empty description
    } as any),
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
describe("PaymentTypeService", () => {
  // Execute all abstract service tests
  abstractTests()

  // PaymentType-specific custom business logic tests
  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: PaymentTypeService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithPaymentType(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new PaymentTypeService()
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
        const paymentType = (mockPrisma as any).addPaymentType({
          description: "Original Description",
        })

        const result = await service.update(paymentType.id, {
          description: "Updated Description",
        })
        expect(result.description).toBe("Updated Description")
      })

      it("should trim description on update", async () => {
        const paymentType = (mockPrisma as any).addPaymentType({
          description: "Original Description",
        })

        const result = await service.update(paymentType.id, {
          description: "  Trimmed Update  ",
        })
        expect(result.description).toBe("Trimmed Update")
      })
    })

    describe("description uniqueness", () => {
      it("should prevent duplicate descriptions on create", async () => {
        ;(mockPrisma as any).addPaymentType({
          description: "Existing Payment Type",
        })

        await expect(
          service.create({
            description: "Existing Payment Type",
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should allow same description when updating same payment type", async () => {
        const paymentType = (mockPrisma as any).addPaymentType({
          description: "Original Description",
        })

        const result = await service.update(paymentType.id, {
          description: "Original Description", // Same description, same payment type
        })

        expect(result.description).toBe("Original Description")
      })

      it("should prevent duplicate descriptions when updating different payment type", async () => {
        ;(mockPrisma as any).addPaymentType({
          id: 1,
          description: "First Payment Type",
        })
        ;(mockPrisma as any).addPaymentType({
          id: 2,
          description: "Second Payment Type",
        })

        await expect(
          service.update(2, {
            description: "First Payment Type", // Trying to use payment type 1's description
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should handle case-sensitive uniqueness check", async () => {
        ;(mockPrisma as any).addPaymentType({
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
