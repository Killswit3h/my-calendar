import { describe, it, expect, beforeEach } from "vitest"
import type { AbstractController } from "@/server/base/AbstractController"
import { NextRequest } from "next/server"
import type { MockPrisma } from "../../utils/mockPrisma"

/**
 * Configuration for abstract controller tests
 */
export interface AbstractControllerTestConfig<
  TController extends AbstractController<any, any, any, any>,
  TModel,
  TCreateInput,
  TUpdateInput,
> {
  /** Controller class constructor */
  controllerClass: new () => TController
  /** Model name in Prisma */
  modelName: string
  /** Base API path (e.g., '/api/employees') */
  apiPath: string
  /** Function to create a valid create input */
  createValidInput: () => TCreateInput
  /** Function to create an invalid create input (should fail validation) */
  createInvalidInput: () => TCreateInput
  /** Function to create a valid update input */
  createUpdateInput: () => TUpdateInput
  /** Function to add a record to mock Prisma */
  addMockRecord: (mockPrisma: MockPrisma, data: any) => any
  /** Function to get the unique ID from a model */
  getIdFromModel: (model: TModel) => number
  /** Optional: Function to extend mock Prisma with model support */
  extendMockPrisma?: (mockPrisma: MockPrisma) => void
}

/**
 * Generic test suite for AbstractController
 * This can be reused for any entity by providing the appropriate configuration
 */
export function createAbstractControllerTests<
  TController extends AbstractController<any, any, any, any>,
  TModel,
  TCreateInput,
  TUpdateInput,
>(config: AbstractControllerTestConfig<TController, TModel, TCreateInput, TUpdateInput>) {
  const { controllerClass, modelName, apiPath, createValidInput, createInvalidInput, createUpdateInput, addMockRecord, getIdFromModel, extendMockPrisma } = config

  return () => {
    describe(`AbstractController - ${modelName}`, () => {
      let mockPrisma: MockPrisma
      let controller: TController

      beforeEach(async () => {
        const { MockPrisma } = await import("../../utils/mockPrisma")
        mockPrisma = new MockPrisma()
        if (extendMockPrisma) {
          extendMockPrisma(mockPrisma)
        }
        const { setMockPrisma } = await import("../../utils/mockPrisma")
        setMockPrisma(mockPrisma)
        controller = new controllerClass()
      })

      describe("handleGet - list", () => {
        it("should return list of all records", async () => {
          addMockRecord(mockPrisma, createValidInput())
          addMockRecord(mockPrisma, createValidInput())

          const url = new URL(`http://localhost:3000${apiPath}`)
          const req = new NextRequest(url)
          const response = await controller.handleGet(req)

          expect(response.status).toBe(200)
          const data = await response.json()
          expect(Array.isArray(data)).toBe(true)
          expect(data.length).toBeGreaterThanOrEqual(2)
        })

        it("should filter by query parameter", async () => {
          addMockRecord(mockPrisma, { ...createValidInput(), active: true })
          addMockRecord(mockPrisma, { ...createValidInput(), active: false })

          const url = new URL(`http://localhost:3000${apiPath}?active=true`)
          const req = new NextRequest(url)
          const response = await controller.handleGet(req)

          expect(response.status).toBe(200)
          const data = await response.json()
          expect(Array.isArray(data)).toBe(true)
        })
      })

      describe("handleGet - by ID", () => {
        it("should return single record by ID", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const url = new URL(`http://localhost:3000${apiPath}/${id}`)
          const req = new NextRequest(url)
          const context = { params: Promise.resolve({ id: String(id) }) }
          const response = await controller.handleGet(req, context)

          expect(response.status).toBe(200)
          const data = await response.json()
          expect(getIdFromModel(data)).toBe(id)
        })

        it("should return 404 when record not found", async () => {
          const url = new URL(`http://localhost:3000${apiPath}/999`)
          const req = new NextRequest(url)
          const context = { params: Promise.resolve({ id: "999" }) }
          const response = await controller.handleGet(req, context)

          expect(response.status).toBe(404)
        })
      })

      describe("handlePost", () => {
        it("should create new record", async () => {
          const url = new URL(`http://localhost:3000${apiPath}`)
          const req = new NextRequest(url, {
            method: "POST",
            body: JSON.stringify(createValidInput()),
          })

          const response = await controller.handlePost(req)
          expect(response.status).toBe(201)
          const data = await response.json()
          expect(data).toBeTruthy()
        })

        it("should return 400 for invalid data", async () => {
          const url = new URL(`http://localhost:3000${apiPath}`)
          const req = new NextRequest(url, {
            method: "POST",
            body: JSON.stringify(createInvalidInput()),
          })

          const response = await controller.handlePost(req)
          expect(response.status).toBe(400)
        })
      })

      describe("handlePatch", () => {
        it("should update existing record", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const url = new URL(`http://localhost:3000${apiPath}/${id}`)
          const req = new NextRequest(url, {
            method: "PATCH",
            body: JSON.stringify(createUpdateInput()),
          })
          const context = { params: Promise.resolve({ id: String(id) }) }

          const response = await controller.handlePatch(req, context)
          expect(response.status).toBe(200)
          const data = await response.json()
          expect(getIdFromModel(data)).toBe(id)
        })

        it("should return 404 when record not found", async () => {
          const url = new URL(`http://localhost:3000${apiPath}/999`)
          const req = new NextRequest(url, {
            method: "PATCH",
            body: JSON.stringify(createUpdateInput()),
          })
          const context = { params: Promise.resolve({ id: "999" }) }

          const response = await controller.handlePatch(req, context)
          expect(response.status).toBe(404)
        })

        it("should return 400 when ID missing", async () => {
          const url = new URL(`http://localhost:3000${apiPath}`)
          const req = new NextRequest(url, {
            method: "PATCH",
            body: JSON.stringify(createUpdateInput()),
          })

          const response = await controller.handlePatch(req)
          expect(response.status).toBe(400)
        })
      })

      describe("handleDelete", () => {
        it("should delete existing record", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const url = new URL(`http://localhost:3000${apiPath}/${id}`)
          const req = new NextRequest(url, { method: "DELETE" })
          const context = { params: Promise.resolve({ id: String(id) }) }

          const response = await controller.handleDelete(req, context)
          expect([200, 204]).toContain(response.status)
          if (response.status === 200) {
            const data = await response.json()
            expect(data.message || data).toBeTruthy()
          }
        })

        it("should return 404 when record not found", async () => {
          const url = new URL(`http://localhost:3000${apiPath}/999`)
          const req = new NextRequest(url, { method: "DELETE" })
          const context = { params: Promise.resolve({ id: "999" }) }

          const response = await controller.handleDelete(req, context)
          expect(response.status).toBe(404)
        })

        it("should return 400 when ID missing", async () => {
          const url = new URL(`http://localhost:3000${apiPath}`)
          const req = new NextRequest(url, { method: "DELETE" })

          const response = await controller.handleDelete(req)
          expect(response.status).toBe(400)
        })
      })

      describe("error handling", () => {
        it("should handle domain errors and return appropriate status codes", async () => {
          const url = new URL(`http://localhost:3000${apiPath}`)
          const req = new NextRequest(url, {
            method: "POST",
            body: JSON.stringify(createInvalidInput()),
          })

          const response = await controller.handlePost(req)
          expect([400, 422]).toContain(response.status)
          const data = await response.json()
          expect(data.error).toBeDefined()
          expect(data.message).toBeDefined()
        })
      })
    })
  }
}
