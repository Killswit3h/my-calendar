import { describe, it, expect, beforeEach } from "vitest"
import { InvoiceController } from "@/server/controllers/InvoiceController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithInvoice } from "../../utils/mockPrismaInvoice"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract controller tests with Invoice configuration
const abstractTests = createAbstractControllerTests<
  InvoiceController,
  PrismaTypes.invoiceGetPayload<{}>,
  PrismaTypes.invoiceCreateInput,
  PrismaTypes.invoiceUpdateInput
>({
  controllerClass: InvoiceController,
  modelName: "invoice",
  apiPath: "/api/invoices",
  createValidInput: () => ({
    number: "INV-001",
    is_contract_invoice: false,
  }),
  createInvalidInput: () => ({
    number: "", // Invalid: empty number
  }),
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
describe("InvoiceController", () => {
  // Execute all abstract controller tests
  abstractTests()

  // Invoice-specific controller tests
  describe("Custom Controller Behavior", () => {
    let mockPrisma: MockPrisma
    let controller: InvoiceController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithInvoice(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new InvoiceController()
    })

    describe("handleGet - filtering", () => {
      it("should filter by number query parameter", async () => {
        ;(mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })
        ;(mockPrisma as any).addInvoice({
          number: "INV-002",
          is_contract_invoice: true,
        })
        ;(mockPrisma as any).addInvoice({
          number: "INV-010",
          is_contract_invoice: false,
        })

        const url = new URL("http://localhost:3000/api/invoices?number=INV-00")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
        expect(data.every((item: any) => 
          item.number.toLowerCase().includes("inv-00")
        )).toBe(true)
      })

      it("should return empty array when no matches found", async () => {
        ;(mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })

        const url = new URL("http://localhost:3000/api/invoices?number=Nonexistent")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(0)
      })

      it("should return all invoices when no filter provided", async () => {
        ;(mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })
        ;(mockPrisma as any).addInvoice({
          number: "INV-002",
          is_contract_invoice: true,
        })

        const url = new URL("http://localhost:3000/api/invoices")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
      })
    })

    describe("handleGet - by ID", () => {
      it("should return 404 when invoice not found", async () => {
        const url = new URL("http://localhost:3000/api/invoices/999")
        const req = new NextRequest(url)
        const context = { params: Promise.resolve({ id: "999" }) }
        const response = await controller.handleGet(req, context)

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data.error).toBeDefined()
      })

      it("should return invoice when found by ID", async () => {
        const invoice = (mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: true,
        })

        const url = new URL(`http://localhost:3000/api/invoices/${invoice.id}`)
        const req = new NextRequest(url)
        const context = { params: Promise.resolve({ id: String(invoice.id) }) }
        const response = await controller.handleGet(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.id).toBe(invoice.id)
        expect(data.number).toBe("INV-001")
        expect(data.is_contract_invoice).toBe(true)
      })
    })

    describe("handlePost - conflict handling", () => {
      it("should return 409 when number already exists", async () => {
        ;(mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })

        const url = new URL("http://localhost:3000/api/invoices")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ 
            number: "INV-001",
          }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })

      it("should return 409 when number already exists (case-insensitive)", async () => {
        ;(mockPrisma as any).addInvoice({
          number: "INV-ABC",
          is_contract_invoice: false,
        })

        const url = new URL("http://localhost:3000/api/invoices")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ 
            number: "inv-abc",
          }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })

      it("should create invoice with is_contract_invoice defaulting to false", async () => {
        const url = new URL("http://localhost:3000/api/invoices")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ 
            number: "INV-001",
          }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(201)
        const data = await response.json()
        expect(data.number).toBe("INV-001")
        expect(data.is_contract_invoice).toBe(false)
      })
    })

    describe("handlePatch - conflict handling", () => {
      it("should return 409 when updating to existing number", async () => {
        ;(mockPrisma as any).addInvoice({
          id: 1,
          number: "INV-001",
          is_contract_invoice: false,
        })
        const invoice2 = (mockPrisma as any).addInvoice({
          id: 2,
          number: "INV-002",
          is_contract_invoice: false,
        })

        const url = new URL(`http://localhost:3000/api/invoices/${invoice2.id}`)
        const req = new NextRequest(url, {
          method: "PATCH",
          body: JSON.stringify({ 
            number: "INV-001",
          }),
        })
        const context = { params: Promise.resolve({ id: String(invoice2.id) }) }
        const response = await controller.handlePatch(req, context)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })

      it("should update is_contract_invoice successfully", async () => {
        const invoice = (mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })

        const url = new URL(`http://localhost:3000/api/invoices/${invoice.id}`)
        const req = new NextRequest(url, {
          method: "PATCH",
          body: JSON.stringify({ 
            is_contract_invoice: true,
          }),
        })
        const context = { params: Promise.resolve({ id: String(invoice.id) }) }
        const response = await controller.handlePatch(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.is_contract_invoice).toBe(true)
      })
    })

    describe("handleDelete", () => {
      it("should return 200 on successful deletion", async () => {
        const invoice = (mockPrisma as any).addInvoice({
          number: "INV-001",
          is_contract_invoice: false,
        })

        const url = new URL(`http://localhost:3000/api/invoices/${invoice.id}`)
        const req = new NextRequest(url, { method: "DELETE" })
        const context = { params: Promise.resolve({ id: String(invoice.id) }) }
        const response = await controller.handleDelete(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.message).toBeDefined()
      })
    })
  })
})
