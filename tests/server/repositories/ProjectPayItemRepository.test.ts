import { describe, it, expect, beforeEach } from "vitest"
import { ProjectPayItemRepository } from "@/server/repositories/ProjectPayItemRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithProjectPayItem } from "../../utils/mockPrismaProjectPayItem"
import { extendMockPrismaWithProject } from "../../utils/mockPrismaProject"
import { extendMockPrismaWithPayItem } from "../../utils/mockPrismaPayItem"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

// Run the abstract repository tests with ProjectPayItem configuration
const abstractTests = createAbstractRepositoryTests<
  ProjectPayItemRepository,
  PrismaTypes.project_pay_itemGetPayload<{}>,
  PrismaTypes.project_pay_itemCreateInput,
  PrismaTypes.project_pay_itemUpdateInput,
  PrismaTypes.project_pay_itemWhereUniqueInput,
  PrismaTypes.project_pay_itemWhereInput
>({
  repositoryClass: ProjectPayItemRepository,
  modelName: "project_pay_item",
  createValidInput: () => ({
    project: { connect: { id: 1 } },
    pay_item: { connect: { id: 1 } },
    contracted_quantity: new Prisma.Decimal(100.0),
    unit_rate: new Prisma.Decimal(50.0),
  }),
  createUpdateInput: () => ({
    status: "ACTIVE",
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: Record<string, any>) => filters as any,
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    // Ensure project and pay_item exist
    ;(mockPrisma as any).addProject({ id: data.project?.connect?.id ?? 1 })
    ;(mockPrisma as any).addPayItem({ id: data.pay_item?.connect?.id ?? 1 })
    
    return (mockPrisma as any).addProjectPayItem({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      project_id: data.project?.connect?.id ?? 1,
      pay_item_id: data.pay_item?.connect?.id ?? 1,
      contracted_quantity: data.contracted_quantity ?? 100.0,
      unit_rate: data.unit_rate ?? 50.0,
      is_original: data.is_original ?? true,
      stockpile_billed: data.stockpile_billed ?? 0,
    })
  },
  getIdFromModel: (model: any) => model.id,
  idField: "id",
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithProject(mockPrisma)
    extendMockPrismaWithPayItem(mockPrisma)
    extendMockPrismaWithProjectPayItem(mockPrisma)
  },
})

// Run abstract tests
describe("ProjectPayItemRepository", () => {
  // Execute all abstract repository tests
  abstractTests()

  // ProjectPayItem-specific custom method tests
  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: ProjectPayItemRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithProject(mockPrisma)
      extendMockPrismaWithPayItem(mockPrisma)
      extendMockPrismaWithProjectPayItem(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new ProjectPayItemRepository()
    })

    describe("findByProjectId", () => {
      it("should find project pay items by project ID", async () => {
        ;(mockPrisma as any).addProject({ id: 1 })
        ;(mockPrisma as any).addProject({ id: 2 })
        ;(mockPrisma as any).addPayItem({ id: 1 })
        ;(mockPrisma as any).addPayItem({ id: 2 })

        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 1,
          contracted_quantity: 100.0,
          unit_rate: 50.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 2,
          contracted_quantity: 200.0,
          unit_rate: 60.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 2,
          pay_item_id: 1,
          contracted_quantity: 150.0,
          unit_rate: 55.0,
        })

        const result = await repository.findByProjectId(1)
        expect(result).toBeTruthy()
        expect(result.length).toBe(2)
        expect(result.every((item) => item.project_id === 1)).toBe(true)
      })

      it("should return empty array when no project pay items found", async () => {
        const result = await repository.findByProjectId(999)
        expect(result).toEqual([])
      })
    })

    describe("findByPayItemId", () => {
      it("should find project pay items by pay item ID", async () => {
        ;(mockPrisma as any).addProject({ id: 1 })
        ;(mockPrisma as any).addProject({ id: 2 })
        ;(mockPrisma as any).addPayItem({ id: 1 })
        ;(mockPrisma as any).addPayItem({ id: 2 })

        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 1,
          contracted_quantity: 100.0,
          unit_rate: 50.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 2,
          pay_item_id: 1,
          contracted_quantity: 200.0,
          unit_rate: 60.0,
        })
        ;(mockPrisma as any).addProjectPayItem({
          project_id: 1,
          pay_item_id: 2,
          contracted_quantity: 150.0,
          unit_rate: 55.0,
        })

        const result = await repository.findByPayItemId(1)
        expect(result).toBeTruthy()
        expect(result.length).toBe(2)
        expect(result.every((item) => item.pay_item_id === 1)).toBe(true)
      })

      it("should return empty array when no project pay items found", async () => {
        const result = await repository.findByPayItemId(999)
        expect(result).toEqual([])
      })
    })
  })
})
