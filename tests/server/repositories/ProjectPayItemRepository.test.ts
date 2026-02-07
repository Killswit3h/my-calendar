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
  createWhereInput: (filters: PrismaTypes.project_pay_itemWhereInput) => filters,
  addMockRecord: (
    mockPrisma: MockPrisma,
    data: PrismaTypes.project_pay_itemCreateInput | Partial<PrismaTypes.project_pay_itemGetPayload<{}>>
  ): PrismaTypes.project_pay_itemGetPayload<{}> => {
    type Ext = MockPrisma & {
      addProject?: (d: { id?: number }) => void
      addPayItem?: (d: { id?: number }) => void
      addProjectPayItem?: (d: {
        id?: number
        project_id?: number
        pay_item_id?: number
        contracted_quantity?: number | Prisma.Decimal
        unit_rate?: number | Prisma.Decimal
        is_original?: boolean
        stockpile_billed?: number | Prisma.Decimal
      }) => PrismaTypes.project_pay_itemGetPayload<{}>
    }
    const ext = mockPrisma as Ext
    const projectId = "project" in data && data.project && typeof data.project === "object" && "connect" in data.project ? (data.project.connect as { id: number }).id : (data as { project_id?: number }).project_id ?? 1
    const payItemId = "pay_item" in data && data.pay_item && typeof data.pay_item === "object" && "connect" in data.pay_item ? (data.pay_item.connect as { id: number }).id : (data as { pay_item_id?: number }).pay_item_id ?? 1
    ext.addProject?.({ id: projectId })
    ext.addPayItem?.({ id: payItemId })
    return ext.addProjectPayItem!({
      id: "id" in data ? data.id : undefined,
      project_id: projectId,
      pay_item_id: payItemId,
      contracted_quantity: "contracted_quantity" in data ? data.contracted_quantity : 100.0,
      unit_rate: "unit_rate" in data ? data.unit_rate : 50.0,
      is_original: "is_original" in data ? data.is_original : true,
      stockpile_billed: "stockpile_billed" in data ? data.stockpile_billed : 0,
    })
  },
  getIdFromModel: (model: PrismaTypes.project_pay_itemGetPayload<{}>) => model.id,
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

    type Ext = MockPrisma & {
      addProject?: (d: { id?: number }) => void
      addPayItem?: (d: { id?: number }) => void
      addProjectPayItem?: (d: {
        project_id?: number
        pay_item_id?: number
        contracted_quantity?: number | Prisma.Decimal
        unit_rate?: number | Prisma.Decimal
      }) => PrismaTypes.project_pay_itemGetPayload<{}>
    }

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
        const ext = mockPrisma as Ext
        ext.addProject?.({ id: 1 })
        ext.addProject?.({ id: 2 })
        ext.addPayItem?.({ id: 1 })
        ext.addPayItem?.({ id: 2 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 1, contracted_quantity: 100.0, unit_rate: 50.0 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 2, contracted_quantity: 200.0, unit_rate: 60.0 })
        ext.addProjectPayItem?.({ project_id: 2, pay_item_id: 1, contracted_quantity: 150.0, unit_rate: 55.0 })

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
        const ext = mockPrisma as Ext
        ext.addProject?.({ id: 1 })
        ext.addProject?.({ id: 2 })
        ext.addPayItem?.({ id: 1 })
        ext.addPayItem?.({ id: 2 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 1, contracted_quantity: 100.0, unit_rate: 50.0 })
        ext.addProjectPayItem?.({ project_id: 2, pay_item_id: 1, contracted_quantity: 200.0, unit_rate: 60.0 })
        ext.addProjectPayItem?.({ project_id: 1, pay_item_id: 2, contracted_quantity: 150.0, unit_rate: 55.0 })

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
