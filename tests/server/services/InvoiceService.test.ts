import { describe, it, expect, beforeEach } from "vitest"
import { InvoiceService } from "@/server/services/InvoiceService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithInvoice } from "../../utils/mockPrismaInvoice"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { ValidationError, ConflictError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract service tests with Invoice configuration
const abstractTests = createAbstractServiceTests<
  InvoiceService,
  PrismaTypes.invoiceGetPayload<{}>,
  PrismaTypes.invoiceCreateInput,
  PrismaTypes.invoiceUpdateInput
>({
  serviceClass: InvoiceService,
  modelName: "invoice",
  createValidInput: () => ({
    number: "INV-001",
    is_contract_invoice: false,
  }),
  createInvalidInput: () =>
    ({
      number: "", // Invalid: empty number
    } as any),
  createUpdateInput: () => ({
    is_contract_invoice: true,
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addInvoice({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      number: data.number ?? "INV-001",
      is_contract_invoice: data.is_contract_invoice ?? false,
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: extendMockPrismaWithInvoice,
})

// Run abstract tests
describe("InvoiceService", () => {
  // Execute all abstract service tests
  abstractTests()

  // Invoice-specific custom business logic tests
  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: InvoiceService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithInvoice(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new InvoiceService()
    })

    describe("validation", () => {
      describe("number validation", () => {
        it("should require number on create", async () => {
          await expect(
            service.create({
              number: undefined,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should reject empty number", async () => {
          await expect(
            service.create({
              number: "",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject whitespace-only number", async () => {
          await expect(
            service.create({
              number: "   ",
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should reject number longer than 255 characters", async () => {
          const longNumber = "a".repeat(256)
          await expect(
            service.create({
              number: longNumber,
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should accept number of exactly 255 characters", async () => {
          const number = "a".repeat(255)
          const result = await service.create({
            number,
          })
          expect(result.number).toBe(number)
        })

        it("should trim number on create", async () => {
          const result = await service.create({
            number: "  INV-001  ",
          })
          expect(result.number).toBe("INV-001")
        })
      })

      describe("is_contract_invoice validation", () => {
        it("should default is_contract_invoice to false when not provided", async () => {
          const result = await service.create({
            number: "INV-001",
          })
          expect(result.is_contract_invoice).toBe(false)
        })

        it("should accept is_contract_invoice as true", async () => {
          const result = await service.create({
            number: "INV-001",
            is_contract_invoice: true,
          })
          expect(result.is_contract_invoice).toBe(true)
        })

        it("should accept is_contract_invoice as false", async () => {
          const result = await service.create({
            number: "INV-001",
            is_contract_invoice: false,
          })
          expect(result.is_contract_invoice).toBe(false)
        })

        it("should reject non-boolean is_contract_invoice", async () => {
          await expect(
            service.create({
              number: "INV-001",
              is_contract_invoice: "true" as any,
            })
          ).rejects.toThrow(ValidationError)
        })

        it("should allow updating is_contract_invoice", async () => {
          const invoice = (mockPrisma as any).addInvoice({
            number: "INV-001",
            is_contract_invoice: false,
          })

          const result = await service.update(invoice.id, {
            is_contract_invoice: true,
          })
          expect(result.is_contract_invoice).toBe(true)
        })
      })

      describe("update validation", () => {
        it("should allow partial updates", async () => {
          const invoice = (mockPrisma as any).addInvoice({
            number: "INV-001",
            is_contract_invoice: false,
          })

          const result = await service.update(invoice.id, {
            is_contract_invoice: true,
          })
          expect(result.is_contract_invoice).toBe(true)
          expect(result.number).toBe("INV-001")
        })

        it("should trim number on update", async () => {
          const invoice = (mockPrisma as any).addInvoice({
            number: "INV-001",
            is_contract_invoice: false,
          })

          const result = await service.update(invoice.id, {
            number: "  INV-002  ",
          })
          expect(result.number).toBe("INV-002")
        })
      })
    })

    describe("number uniqueness", () => {
      it("should prevent duplicate numbers on create (case-insensitive)", async () => {
        ;(mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })

        await expect(
          service.create({
            number: "INV-001",
          })
        ).rejects.toThrow(ConflictError)

        await expect(
          service.create({
            number: "inv-001",
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should allow same number when updating same invoice", async () => {
        const invoice = (mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })

        const result = await service.update(invoice.id, {
          number: "INV-001", // Same number, same invoice
        })

        expect(result.number).toBe("INV-001")
      })

      it("should prevent duplicate numbers when updating different invoice", async () => {
        ;(mockPrisma as any).addInvoice({
          id: 1,
          number: "INV-001",
          is_contract_invoice: false,
        })
        ;(mockPrisma as any).addInvoice({
          id: 2,
          number: "INV-002",
          is_contract_invoice: false,
        })

        await expect(
          service.update(2, {
            number: "INV-001", // Trying to use invoice 1's number
          })
        ).rejects.toThrow(ConflictError)
      })

      it("should handle case-insensitive uniqueness check", async () => {
        ;(mockPrisma as any).addInvoice({
          number: "INV-ABC",
          is_contract_invoice: false,
        })

        // Should prevent duplicate with different case
        await expect(
          service.create({
            number: "inv-abc",
          })
        ).rejects.toThrow(ConflictError)
      })
    })
  })
})
