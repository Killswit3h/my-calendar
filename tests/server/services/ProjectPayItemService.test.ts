import { describe, it, expect, beforeEach } from "vitest"
import { ProjectPayItemService } from "@/server/services/ProjectPayItemService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithProjectPayItem } from "../../utils/mockPrismaProjectPayItem"
import { extendMockPrismaWithProject } from "../../utils/mockPrismaProject"
import { extendMockPrismaWithPayItem } from "../../utils/mockPrismaPayItem"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { ValidationError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"
import { Prisma } from "@prisma/client"

// Run the abstract service tests with ProjectPayItem configuration
const abstractTests = createAbstractServiceTests<
  ProjectPayItemService,
  PrismaTypes.project_pay_itemGetPayload<{}>,
  PrismaTypes.project_pay_itemCreateInput,
  PrismaTypes.project_pay_itemUpdateInput
>({
  serviceClass: ProjectPayItemService,
  modelName: "project_pay_item",
  createValidInput: () => ({
    project_id: 1,
    pay_item_id: 1,
    contracted_quantity: new Prisma.Decimal(100.0),
    unit_rate: new Prisma.Decimal(50.0),
  } as any),
  createInvalidInput: () =>
    ({
      project_id: 1,
      pay_item_id: 1,
      contracted_quantity: -10, // Invalid: negative
    } as any),
  createUpdateInput: () => ({
    status: "ACTIVE",
  }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    // Ensure project and pay_item exist
    ;(mockPrisma as any).addProject({ id: data.project_id ?? 1 })
    ;(mockPrisma as any).addPayItem({ id: data.pay_item_id ?? 1 })
    
    return (mockPrisma as any).addProjectPayItem({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      project_id: data.project_id ?? 1,
      pay_item_id: data.pay_item_id ?? 1,
      contracted_quantity: data.contracted_quantity ?? 100.0,
      unit_rate: data.unit_rate ?? 50.0,
      is_original: data.is_original ?? true,
      stockpile_billed: data.stockpile_billed ?? 0,
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithProject(mockPrisma)
    extendMockPrismaWithPayItem(mockPrisma)
    extendMockPrismaWithProjectPayItem(mockPrisma)
    // Ensure default FKs exist for create tests (project_id:1, pay_item_id:1)
    ;(mockPrisma as { addProject?: (d: { id?: number }) => void }).addProject?.({ id: 1 })
    ;(mockPrisma as { addPayItem?: (d: { id?: number }) => void }).addPayItem?.({ id: 1 })
  },
})

// Run abstract tests
describe("ProjectPayItemService", () => {
  // Execute all abstract service tests
  abstractTests()

  // ProjectPayItem-specific custom business logic tests
  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: ProjectPayItemService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithProject(mockPrisma)
      extendMockPrismaWithPayItem(mockPrisma)
      extendMockPrismaWithProjectPayItem(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new ProjectPayItemService()
    })

    describe("validation", () => {
      describe("project_id validation", () => {
        it("should require project_id on create", async () => {
          await expect(
            service.create({
              pay_item_id: 1,
              contracted_quantity: 100.0,
              unit_rate: 50.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should validate project exists", async () => {
          ;(mockPrisma as any).addPayItem({ id: 1 })
          await expect(
            service.create({
              project_id: 999,
              pay_item_id: 1,
              contracted_quantity: 100.0,
              unit_rate: 50.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })
      })

      describe("pay_item_id validation", () => {
        it("should require pay_item_id on create", async () => {
          ;(mockPrisma as any).addProject({ id: 1 })
          await expect(
            service.create({
              project_id: 1,
              contracted_quantity: 100.0,
              unit_rate: 50.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should validate pay_item exists", async () => {
          ;(mockPrisma as any).addProject({ id: 1 })
          await expect(
            service.create({
              project_id: 1,
              pay_item_id: 999,
              contracted_quantity: 100.0,
              unit_rate: 50.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })
      })

      describe("contracted_quantity validation", () => {
        it("should require contracted_quantity on create", async () => {
          ;(mockPrisma as any).addProject({ id: 1 })
          ;(mockPrisma as any).addPayItem({ id: 1 })
          await expect(
            service.create({
              project_id: 1,
              pay_item_id: 1,
              unit_rate: 50.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should reject negative contracted_quantity", async () => {
          ;(mockPrisma as any).addProject({ id: 1 })
          ;(mockPrisma as any).addPayItem({ id: 1 })
          await expect(
            service.create({
              project_id: 1,
              pay_item_id: 1,
              contracted_quantity: -10,
              unit_rate: 50.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })
      })

      describe("unit_rate validation", () => {
        it("should require unit_rate on create", async () => {
          ;(mockPrisma as any).addProject({ id: 1 })
          ;(mockPrisma as any).addPayItem({ id: 1 })
          await expect(
            service.create({
              project_id: 1,
              pay_item_id: 1,
              contracted_quantity: 100.0,
            } as any)
          ).rejects.toThrow(ValidationError)
        })

        it("should reject negative unit_rate", async () => {
          ;(mockPrisma as any).addProject({ id: 1 })
          ;(mockPrisma as any).addPayItem({ id: 1 })
          await expect(
            service.create({
              project_id: 1,
              pay_item_id: 1,
              contracted_quantity: 100.0,
              unit_rate: -5,
            } as any)
          ).rejects.toThrow(ValidationError)
        })
      })

      describe("stockpile_billed validation", () => {
        it("should reject negative stockpile_billed", async () => {
          ;(mockPrisma as any).addProject({ id: 1 })
          ;(mockPrisma as any).addPayItem({ id: 1 })
          await expect(
            service.create({
              project_id: 1,
              pay_item_id: 1,
              contracted_quantity: 100.0,
              unit_rate: 50.0,
              stockpile_billed: -10,
            } as any)
          ).rejects.toThrow(ValidationError)
        })
      })
    })

    describe("defaults", () => {
      it("should set is_original to true by default", async () => {
        ;(mockPrisma as any).addProject({ id: 1 })
        ;(mockPrisma as any).addPayItem({ id: 1 })
        const result = await service.create({
          project_id: 1,
          pay_item_id: 1,
          contracted_quantity: 100.0,
          unit_rate: 50.0,
        } as any)
        expect(result.is_original).toBe(true)
      })

      it("should set stockpile_billed to 0 by default", async () => {
        ;(mockPrisma as any).addProject({ id: 1 })
        ;(mockPrisma as any).addPayItem({ id: 1 })
        const result = await service.create({
          project_id: 1,
          pay_item_id: 1,
          contracted_quantity: 100.0,
          unit_rate: 50.0,
        } as any)
        expect(result.stockpile_billed).toEqual(new Prisma.Decimal(0))
      })
    })
  })
})
