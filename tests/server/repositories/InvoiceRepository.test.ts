import { describe, it, expect, beforeEach } from "vitest"
import { InvoiceRepository } from "@/server/repositories/InvoiceRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithInvoice } from "../../utils/mockPrismaInvoice"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract repository tests with Invoice configuration
const abstractTests = createAbstractRepositoryTests<
  InvoiceRepository,
  PrismaTypes.invoiceGetPayload<{}>,
  PrismaTypes.invoiceCreateInput,
  PrismaTypes.invoiceUpdateInput,
  PrismaTypes.invoiceWhereUniqueInput,
  PrismaTypes.invoiceWhereInput
>({
  repositoryClass: InvoiceRepository,
  modelName: "invoice",
  createValidInput: () => ({
    number: "INV-001",
    is_contract_invoice: false,
  }),
  createUpdateInput: () => ({
    is_contract_invoice: true,
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: Record<string, any>) => filters as any,
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    return (mockPrisma as any).addInvoice({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      number: data.number ?? "INV-001",
      is_contract_invoice: data.is_contract_invoice ?? false,
    })
  },
  getIdFromModel: (model: any) => model.id,
  idField: "id",
  extendMockPrisma: extendMockPrismaWithInvoice,
})

// Run abstract tests
describe("InvoiceRepository", () => {
  // Execute all abstract repository tests
  abstractTests()

  // Invoice-specific custom method tests
  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: InvoiceRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithInvoice(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new InvoiceRepository()
    })

    describe("findByNumber", () => {
      it("should find invoice by number (case-insensitive)", async () => {
        ;(mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })
        ;(mockPrisma as any).addInvoice({
          number: "INV-002",
          is_contract_invoice: true,
        })

        const result = await repository.findByNumber("INV-001")
        expect(result).toBeTruthy()
        expect(result?.number).toBe("INV-001")
        expect(result?.is_contract_invoice).toBe(false)
      })

      it("should return null when number not found", async () => {
        const result = await repository.findByNumber("Nonexistent")
        expect(result).toBeNull()
      })

      it("should handle case-insensitive matching", async () => {
        ;(mockPrisma as any).addInvoice({
          number: "INV-ABC",
          is_contract_invoice: false,
        })

        const result = await repository.findByNumber("inv-abc")
        expect(result).toBeTruthy()
        expect(result?.number).toBe("INV-ABC")
      })
    })

    describe("findByIds", () => {
      it("should find multiple invoices by IDs", async () => {
        const invoice1 = (mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })
        const invoice2 = (mockPrisma as any).addInvoice({
          number: "INV-002",
          is_contract_invoice: true,
        })
        ;(mockPrisma as any).addInvoice({
          number: "INV-003",
          is_contract_invoice: false,
        })

        const results = await repository.findByIds([invoice1.id, invoice2.id])
        expect(results).toHaveLength(2)
        expect(results.map((r) => r.id).sort()).toEqual([invoice1.id, invoice2.id].sort())
      })

      it("should return empty array when no IDs match", async () => {
        const results = await repository.findByIds([999, 1000])
        expect(results).toHaveLength(0)
      })

      it("should return partial results when some IDs match", async () => {
        const invoice1 = (mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })

        const results = await repository.findByIds([invoice1.id, 999])
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe(invoice1.id)
      })
    })
  })
})
