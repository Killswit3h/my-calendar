import { describe, it, expect, beforeEach } from "vitest"
import { ScopeOfWorkController } from "@/server/controllers/ScopeOfWorkController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithScopeOfWork } from "../../utils/mockPrismaScopeOfWork"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import type { Prisma as PrismaTypes } from "@prisma/client"

// Run the abstract controller tests with ScopeOfWork configuration
const abstractTests = createAbstractControllerTests<
  ScopeOfWorkController,
  PrismaTypes.scope_of_workGetPayload<{}>,
  PrismaTypes.scope_of_workCreateInput,
  PrismaTypes.scope_of_workUpdateInput
>({
  controllerClass: ScopeOfWorkController,
  modelName: "scope_of_work",
  apiPath: "/api/scope-of-works",
  createValidInput: () => ({
    description: "Test Scope of Work",
  }),
  createInvalidInput: () => ({
    description: "", // Invalid: empty description
  }),
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
describe("ScopeOfWorkController", () => {
  // Execute all abstract controller tests
  abstractTests()

  // ScopeOfWork-specific controller tests
  describe("Custom Controller Behavior", () => {
    let mockPrisma: MockPrisma
    let controller: ScopeOfWorkController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithScopeOfWork(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new ScopeOfWorkController()
    })

    describe("handleGet - filtering", () => {
      it("should filter by description query parameter", async () => {
        ;(mockPrisma as any).addScopeOfWork({
          description: "Excavation Work",
        })
        ;(mockPrisma as any).addScopeOfWork({
          description: "Concrete Pouring",
        })
        ;(mockPrisma as any).addScopeOfWork({
          description: "Excavation and Grading",
        })

        const url = new URL("http://localhost:3000/api/scope-of-works?description=Excavation")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
        expect(data.every((item: any) => 
          item.description.toLowerCase().includes("excavation")
        )).toBe(true)
      })

      it("should return empty array when no matches found", async () => {
        ;(mockPrisma as any).addScopeOfWork({
          description: "Excavation Work",
        })

        const url = new URL("http://localhost:3000/api/scope-of-works?description=Nonexistent")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(0)
      })

      it("should return all scopes when no filter provided", async () => {
        ;(mockPrisma as any).addScopeOfWork({
          description: "Scope 1",
        })
        ;(mockPrisma as any).addScopeOfWork({
          description: "Scope 2",
        })

        const url = new URL("http://localhost:3000/api/scope-of-works")
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(2)
      })
    })

    describe("handleGet - by ID", () => {
      it("should return 404 when scope not found", async () => {
        const url = new URL("http://localhost:3000/api/scope-of-works/999")
        const req = new NextRequest(url)
        const context = { params: Promise.resolve({ id: "999" }) }
        const response = await controller.handleGet(req, context)

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data.error).toBeDefined()
      })
    })

    describe("handlePost - conflict handling", () => {
      it("should return 409 when description already exists", async () => {
        ;(mockPrisma as any).addScopeOfWork({
          description: "Existing Scope",
        })

        const url = new URL("http://localhost:3000/api/scope-of-works")
        const req = new NextRequest(url, {
          method: "POST",
          body: JSON.stringify({ description: "Existing Scope" }),
        })
        const response = await controller.handlePost(req)

        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.error).toBe("CONFLICT")
      })
    })

    describe("handleDelete", () => {
      it("should return 200 on successful deletion", async () => {
        const scope = (mockPrisma as any).addScopeOfWork({
          description: "To Be Deleted",
        })

        const url = new URL(`http://localhost:3000/api/scope-of-works/${scope.id}`)
        const req = new NextRequest(url, { method: "DELETE" })
        const context = { params: Promise.resolve({ id: String(scope.id) }) }
        const response = await controller.handleDelete(req, context)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.message).toBeDefined()
      })
    })
  })
})
