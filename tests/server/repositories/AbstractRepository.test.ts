import { describe, it, expect, beforeEach, vi } from "vitest"
import type { AbstractRepository } from "@/server/base/AbstractRepository"
import { NotFoundError, ConflictError } from "@/server/base/types"
import type { MockPrisma } from "../../utils/mockPrisma"

/**
 * Configuration for abstract repository tests
 */
export interface AbstractRepositoryTestConfig<
  TRepository extends AbstractRepository<any, any, any, any, any>,
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput,
  TWhereInput
> {
  /** Repository class constructor */
  repositoryClass: new () => TRepository
  /** Model name in Prisma (e.g., 'employee', 'customer') */
  modelName: string
  /** Function to create a valid create input */
  createValidInput: () => TCreateInput
  /** Function to create a valid update input */
  createUpdateInput: () => TUpdateInput
  /** Function to create a unique identifier (e.g., { id: 1 }) */
  createUniqueInput: (id: number) => TWhereUniqueInput
  /** Function to create a where input for filtering */
  createWhereInput: (filters: Record<string, any>) => TWhereInput
  /** Function to add a record to mock Prisma */
  addMockRecord: (mockPrisma: MockPrisma, data: any) => any
  /** Function to get the unique ID from a model */
  getIdFromModel: (model: TModel) => number
  /** Field name for unique identifier (default: 'id') */
  idField?: string
  /** Optional: Function to extend mock Prisma with model support */
  extendMockPrisma?: (mockPrisma: MockPrisma) => void
}

/**
 * Generic test suite for AbstractRepository
 * This can be reused for any entity by providing the appropriate configuration
 */
export function createAbstractRepositoryTests<
  TRepository extends AbstractRepository<any, any, any, any, any>,
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput,
  TWhereInput
>(
  config: AbstractRepositoryTestConfig<
    TRepository,
    TModel,
    TCreateInput,
    TUpdateInput,
    TWhereUniqueInput,
    TWhereInput
  >
) {
  const {
    repositoryClass,
    modelName,
    createValidInput,
    createUpdateInput,
    createUniqueInput,
    createWhereInput,
    addMockRecord,
    getIdFromModel,
    idField = "id",
    extendMockPrisma,
  } = config

  return () => {
    describe(`AbstractRepository - ${modelName}`, () => {
      let mockPrisma: MockPrisma
      let repository: TRepository

      beforeEach(async () => {
        const { MockPrisma } = await import("../../utils/mockPrisma")
        mockPrisma = new MockPrisma()
        if (extendMockPrisma) {
          extendMockPrisma(mockPrisma)
        }
        const { setMockPrisma } = await import("../../utils/mockPrisma")
        setMockPrisma(mockPrisma)
        repository = new repositoryClass()
      })

      describe("findMany", () => {
        it("should return all records when no filters provided", async () => {
          const record1 = addMockRecord(mockPrisma, createValidInput())
          const record2 = addMockRecord(mockPrisma, createValidInput())

          const results = await repository.findMany()
          expect(results.length).toBeGreaterThanOrEqual(2)
        })

        it("should filter records by where clause", async () => {
          const record1 = addMockRecord(mockPrisma, {
            ...createValidInput(),
            active: true,
          })
          const record2 = addMockRecord(mockPrisma, {
            ...createValidInput(),
            active: false,
          })

          const results = await repository.findMany(
            createWhereInput({ active: true })
          )
          expect(results.length).toBeGreaterThanOrEqual(1)
        })

        it("should support pagination with take and skip", async () => {
          addMockRecord(mockPrisma, createValidInput())
          addMockRecord(mockPrisma, createValidInput())
          addMockRecord(mockPrisma, createValidInput())

          const results = await repository.findMany(undefined, {
            take: 2,
            skip: 1,
          })
          expect(results.length).toBeLessThanOrEqual(2)
        })
      })

      describe("findUnique", () => {
        it("should return record when found", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const result = await repository.findUnique(createUniqueInput(id))
          expect(result).toBeTruthy()
          expect(getIdFromModel(result!)).toBe(id)
        })

        it("should return null when record not found", async () => {
          const result = await repository.findUnique(createUniqueInput(999))
          expect(result).toBeNull()
        })
      })

      describe("findFirst", () => {
        it("should return first matching record", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const result = await repository.findFirst(
            createWhereInput({ [idField]: id })
          )
          expect(result).toBeTruthy()
          expect(getIdFromModel(result!)).toBe(id)
        })

        it("should return null when no match found", async () => {
          const result = await repository.findFirst(
            createWhereInput({ [idField]: 999 })
          )
          expect(result).toBeNull()
        })
      })

      describe("create", () => {
        it("should create a new record", async () => {
          const data = createValidInput()

          const result = await repository.create(data)
          expect(result).toBeTruthy()
        })

        it("should handle Prisma unique constraint violations", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const modelDelegate = (mockPrisma as any)[modelName]

          // Simulate unique constraint violation
          const originalCreate = modelDelegate.create
          const Prisma = await import("@prisma/client")
          modelDelegate.create = vi.fn().mockRejectedValue(
            new Prisma.Prisma.PrismaClientKnownRequestError(
              "Unique constraint violation",
              {
                code: "P2002",
                clientVersion: "test",
                meta: { target: [idField] },
              }
            )
          )

          await expect(repository.create(createValidInput())).rejects.toThrow(
            ConflictError
          )

          modelDelegate.create = originalCreate
        })
      })

      describe("update", () => {
        it("should update an existing record", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const updateData = createUpdateInput()
          const result = await repository.update(
            createUniqueInput(id),
            updateData
          )
          expect(result).toBeTruthy()
          expect(getIdFromModel(result)).toBe(id)
        })

        it("should throw NotFoundError when record does not exist", async () => {
          await expect(
            repository.update(createUniqueInput(999), createUpdateInput())
          ).rejects.toThrow(NotFoundError)
        })
      })

      describe("delete", () => {
        it("should delete an existing record", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const result = await repository.delete(createUniqueInput(id))
          expect(getIdFromModel(result)).toBe(id)

          const found = await repository.findUnique(createUniqueInput(id))
          expect(found).toBeNull()
        })

        it("should throw NotFoundError when record does not exist", async () => {
          await expect(
            repository.delete(createUniqueInput(999))
          ).rejects.toThrow(NotFoundError)
        })
      })

      describe("count", () => {
        it("should return total count when no filters", async () => {
          addMockRecord(mockPrisma, createValidInput())
          addMockRecord(mockPrisma, createValidInput())

          const count = await repository.count()
          expect(count).toBeGreaterThanOrEqual(2)
        })

        it("should return filtered count", async () => {
          addMockRecord(mockPrisma, { ...createValidInput(), active: true })
          addMockRecord(mockPrisma, { ...createValidInput(), active: false })

          const count = await repository.count(
            createWhereInput({ active: true })
          )
          expect(count).toBeGreaterThanOrEqual(1)
        })
      })

      describe("exists", () => {
        it("should return true when record exists", async () => {
          const record = addMockRecord(mockPrisma, createValidInput())
          const id = getIdFromModel(record)

          const exists = await repository.exists(createUniqueInput(id))
          expect(exists).toBe(true)
        })

        it("should return false when record does not exist", async () => {
          const exists = await repository.exists(createUniqueInput(999))
          expect(exists).toBe(false)
        })
      })
    })
  }
}
