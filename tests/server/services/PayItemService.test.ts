import { describe, it, expect, beforeEach } from "vitest"
import { PayItemService } from "@/server/services/PayItemService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithPayItem } from "../../utils/mockPrismaPayItem"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { ValidationError, ConflictError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract service tests with PayItem configuration
const abstractTests = createAbstractServiceTests<
  PayItemService,
  PrismaTypes.pay_itemGetPayload<{}>,
  PrismaTypes.pay_itemCreateInput,
  PrismaTypes.pay_itemUpdateInput
>({
  serviceClass: PayItemService,
  modelName: "pay_item",
  createValidInput: () => ({
    number: "123-456",
    description: "Test Pay Item",
    unit: "EA",
  }),
  createInvalidInput: () =>
    ({
      number: "", // Invalid: empty number
    } as any),
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
describe("PayItemService", () => {
  // Execute all abstract service tests
  abstractTests()

  // PayItem-specific custom business logic tests
  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: PayItemService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithPayItem(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new PayItemService()
    })

    describe("validation", () => {
      describe("number validation", () => {
        it("should require number on create", async () => {
          await expect(
            service.create({
              number: undefined,
              description: "Test",
              unit: "EA",
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should reject empty number", async () => {
          await expect(
            service.create({
              number: "",
              description: "Test",
              unit: "EA",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject whitespace-only number", async () => {
          await expect(
            service.create({
              number: "   ",
              description: "Test",
              unit: "EA",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject number longer than 64 characters", async () => {
          const longNumber = "a".repeat(65)
          await expect(
            service.create({
              number: longNumber,
              description: "Test",
              unit: "EA",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should accept number of exactly 64 characters", async () => {
          const number = "a".repeat(64)
          const result = await service.create({
            number,
            description: "Test",
            unit: "EA",
          })
          expect(result.number).toBe(number)
        })

        it("should trim number on create", async () => {
          const result = await service.create({
            number: "  123-456  ",
            description: "Test",
            unit: "EA",
          })
          expect(result.number).toBe("123-456")
        })
      })

      describe("description validation", () => {
        it("should require description on create", async () => {
          await expect(
            service.create({
              number: "123-456",
              description: undefined,
              unit: "EA",
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should reject empty description", async () => {
          await expect(
            service.create({
              number: "123-456",
              description: "",
              unit: "EA",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject whitespace-only description", async () => {
          await expect(
            service.create({
              number: "123-456",
              description: "   ",
              unit: "EA",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject description longer than 255 characters", async () => {
          const longDescription = "a".repeat(256)
          await expect(
            service.create({
              number: "123-456",
              description: longDescription,
              unit: "EA",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should accept description of exactly 255 characters", async () => {
          const description = "a".repeat(255)
          const result = await service.create({
            number: "123-456",
            description,
            unit: "EA",
          })
          expect(result.description).toBe(description)
        })

        it("should trim description on create", async () => {
          const result = await service.create({
            number: "123-456",
            description: "  Trimmed Description  ",
            unit: "EA",
          })
          expect(result.description).toBe("Trimmed Description")
        })
      })

      describe("unit validation", () => {
        it("should require unit on create", async () => {
          await expect(
            service.create({
              number: "123-456",
              description: "Test",
              unit: undefined,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should reject empty unit", async () => {
          await expect(
            service.create({
              number: "123-456",
              description: "Test",
              unit: "",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject whitespace-only unit", async () => {
          await expect(
            service.create({
              number: "123-456",
              description: "Test",
              unit: "   ",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject unit longer than 32 characters", async () => {
          const longUnit = "a".repeat(33)
          await expect(
            service.create({
              number: "123-456",
              description: "Test",
              unit: longUnit,
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should accept unit of exactly 32 characters", async () => {
          const unit = "a".repeat(32)
          const result = await service.create({
            number: "123-456",
            description: "Test",
            unit,
          })
          expect(result.unit).toBe(unit)
        })

        it("should trim unit on create", async () => {
          const result = await service.create({
            number: "123-456",
            description: "Test",
            unit: "  EA  ",
          })
          expect(result.unit).toBe("EA")
        })
      })

      describe("update validation", () => {
        it("should allow partial updates", async () => {
          const payItem = (mockPrisma as any).addPayItem({
            number: "123-456",
            description: "Original Description",
            unit: "EA",
          })

          const result = await service.update(payItem.id, {
            description: "Updated Description",
          })
          expect(result.description).toBe("Updated Description")
          expect(result.number).toBe("123-456")
          expect(result.unit).toBe("EA")
        })

        it("should trim fields on update", async () => {
          const payItem = (mockPrisma as any).addPayItem({
            number: "123-456",
            description: "Original",
            unit: "EA",
          })

          const result = await service.update(payItem.id, {
            number: "  789-012  ",
            description: "  Trimmed Update  ",
            unit: "  FT  ",
          })
          expect(result.number).toBe("789-012")
          expect(result.description).toBe("Trimmed Update")
          expect(result.unit).toBe("FT")
        })
      })
    })

    describe("number uniqueness", () => {
      it("should prevent duplicate numbers on create (case-insensitive)", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "123-456",
          description: "Existing Item",
          unit: "EA",
        })

        await expect(
          service.create({
            number: "123-456",
            description: "New Item",
            unit: "FT",
          })
        ).rejects.toThrow(ConflictError)

        await expect(
          service.create({
            number: "123-456".toUpperCase(),
            description: "New Item",
            unit: "FT",
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should allow same number when updating same pay item", async () => {
        const payItem = (mockPrisma as any).addPayItem({
          number: "123-456",
          description: "Original Description",
          unit: "EA",
        })

        const result = await service.update(payItem.id, {
          number: "123-456", // Same number, same pay item
        })

        expect(result.number).toBe("123-456")
      })

      it("should prevent duplicate numbers when updating different pay item", async () => {
        ;(mockPrisma as any).addPayItem({
          id: 1,
          number: "123-456",
          description: "First Item",
          unit: "EA",
        })
        ;(mockPrisma as any).addPayItem({
          id: 2,
          number: "789-012",
          description: "Second Item",
          unit: "FT",
        })

        await expect(
          service.update(2, {
            number: "123-456", // Trying to use pay item 1's number
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should handle case-insensitive uniqueness check", async () => {
        ;(mockPrisma as any).addPayItem({
          number: "ABC-123",
          description: "Existing Item",
          unit: "EA",
        })

        // Should prevent duplicate with different case
        await expect(
          service.create({
            number: "abc-123",
            description: "New Item",
            unit: "FT",
          })
        ).rejects.toThrow(ConflictError)
      })
    })
  })
})
