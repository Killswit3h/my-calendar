import { describe, it, expect, beforeEach, vi } from "vitest"
import type { AbstractService } from "@/server/base/AbstractService"
import { NotFoundError, ValidationError } from "@/server/base/types"
import type { MockPrisma } from "../../utils/mockPrisma"

/**
 * Configuration for abstract service tests
 */
export interface AbstractServiceTestConfig<
  TService extends AbstractService<any, any, any, any, any>,
  TModel,
  TCreateInput,
  TUpdateInput,
> {
  /** Service class constructor */
  serviceClass: new () => TService
  /** Model name in Prisma */
  modelName: string
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
 * Generic test suite for AbstractService
 * This can be reused for any entity by providing the appropriate configuration
 */
export function createAbstractServiceTests<
  TService extends AbstractService<any, any, any, any, any>,
  TModel,
  TCreateInput,
  TUpdateInput,
>(config: AbstractServiceTestConfig<TService, TModel, TCreateInput, TUpdateInput>) {
  const { serviceClass, modelName, createValidInput, createInvalidInput, createUpdateInput, addMockRecord, getIdFromModel, extendMockPrisma } = config

  return () => {
    describe(`AbstractService - ${modelName}`, () => {
      let mockPrisma: MockPrisma
      let service: TService

      beforeEach(async () => {
        const { MockPrisma } = await import("../../utils/mockPrisma")
        mockPrisma = new MockPrisma()
        if (extendMockPrisma) {
          extendMockPrisma(mockPrisma)
        }
        const { setMockPrisma } = await import("../../utils/mockPrisma")
        setMockPrisma(mockPrisma)
        service = new serviceClass()
      })

      describe("list", () => {
        it("should return all records", async () => {
          addMockRecord(mockPrisma, createValidInput())
          addMockRecord(mockPrisma, createValidInput())

          const results = await service.list()
          expect(results.length).toBeGreaterThanOrEqual(2)
        })

        it("should filter records", async () => {
          addMockRecord(mockPrisma, { ...createValidInput(), active: true })
          addMockRecord(mockPrisma, { ...createValidInput(), active: false })

          const results = await service.list({ active: true })
          expect(results.length).toBeGreaterThanOrEqual(1)
        })
      })

      describe("getById", () => {
        it("should return record when found", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const result = await service.getById(id)
          expect(result).toBeTruthy()
          expect(getIdFromModel(result)).toBe(id)
        })

        it("should throw NotFoundError when record does not exist", async () => {
          await expect(service.getById(999)).rejects.toThrow(NotFoundError)
        })
      })

      describe("create", () => {
        it("should create record with validation", async () => {
          const data = createValidInput()

          const result = await service.create(data)
          expect(result).toBeTruthy()
        })

        it("should call validation before create", async () => {
          await expect(service.create(createInvalidInput())).rejects.toThrow(
            ValidationError
          )
        })
      })

      describe("update", () => {
        it("should update existing record", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const updateData = createUpdateInput()
          const result = await service.update(id, updateData)
          expect(result).toBeTruthy()
          expect(getIdFromModel(result)).toBe(id)
        })

        it("should throw NotFoundError when record does not exist", async () => {
          await expect(service.update(999, createUpdateInput())).rejects.toThrow(
            NotFoundError
          )
        })
      })

      describe("delete", () => {
        it("should delete existing record", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const result = await service.delete(id)
          expect(getIdFromModel(result)).toBe(id)

          await expect(service.getById(id)).rejects.toThrow(NotFoundError)
        })

        it("should throw NotFoundError when record does not exist", async () => {
          await expect(service.delete(999)).rejects.toThrow(NotFoundError)
        })
      })

      describe("listPaginated", () => {
        it("should return paginated results", async () => {
          for (let i = 1; i <= 5; i++) {
            addMockRecord(mockPrisma, createValidInput())
          }

          const result = await service.listPaginated(undefined, {
            page: 1,
            pageSize: 2,
          })
          expect(result.data.length).toBeLessThanOrEqual(2)
          expect(result.pagination.total).toBeGreaterThanOrEqual(5)
          expect(result.pagination.page).toBe(1)
          expect(result.pagination.pageSize).toBe(2)
          expect(result.pagination.totalPages).toBeGreaterThanOrEqual(3)
        })
      })
    })
  }
}
