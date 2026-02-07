import { describe, it, expect, beforeEach } from "vitest"
import { EventAssignmentService } from "@/server/services/EventAssignmentService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEventAssignment } from "../../utils/mockPrismaEventAssignment"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractServiceTests } from "./AbstractService.test"
import { ValidationError, ConflictError } from "@/server/base/types"
import type { Prisma as PrismaTypes } from "@prisma/client"

type MockWithHelpers = MockPrisma & {
  addEvent?: (d: { id?: number }) => void
  addEmployee?: (d: { id?: number }) => void
  addEventAssignment?: (d: {
    id?: number
    event_id: number
    employee_id: number
  }) => PrismaTypes.event_assignmentGetPayload<{}>
  _eventAssignmentAddCount?: number
}

const abstractTests = createAbstractServiceTests<
  EventAssignmentService,
  PrismaTypes.event_assignmentGetPayload<{}>,
  PrismaTypes.event_assignmentCreateInput,
  PrismaTypes.event_assignmentUpdateInput
>({
  serviceClass: EventAssignmentService,
  modelName: "event_assignment",
  createValidInput: () => ({ event_id: 1, employee_id: 1 } as any),
  createInvalidInput: () => ({ event_id: 1 } as any), // missing employee_id
  createUpdateInput: () => ({ employee_id: 2 }),
  addMockRecord: (mockPrisma: MockPrisma, data: any) => {
    const ext = mockPrisma as MockWithHelpers
    ext._eventAssignmentAddCount = (ext._eventAssignmentAddCount ?? 0) + 1
    const n = ext._eventAssignmentAddCount
    const eventId = n
    const employeeId = 1
    ext.addEvent?.({ id: eventId })
    ext.addEmployee?.({ id: employeeId })
    return ext.addEventAssignment!({
      id: data.id ?? Math.floor(Math.random() * 1000000) + 1,
      event_id: eventId,
      employee_id: employeeId,
    })
  },
  getIdFromModel: (model: any) => model.id,
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithEventAssignment(mockPrisma)
    const ext = mockPrisma as MockWithHelpers
    ext.addEvent?.({ id: 1 })
    ext.addEvent?.({ id: 2 })
    ext.addEmployee?.({ id: 1 })
    ext.addEmployee?.({ id: 2 })
  },
})

describe("EventAssignmentService", () => {
  abstractTests()

  describe("Custom Business Logic", () => {
    let mockPrisma: MockPrisma
    let service: EventAssignmentService

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithEventAssignment(mockPrisma)
      setMockPrisma(mockPrisma)
      service = new EventAssignmentService()
    })

    describe("validation", () => {
      it("should require event_id on create", async () => {
        ;(mockPrisma as MockWithHelpers).addEmployee?.({ id: 1 })
        await expect(
          service.create({
            employee_id: 1,
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should require employee_id on create", async () => {
        ;(mockPrisma as MockWithHelpers).addEvent?.({ id: 1 })
        await expect(
          service.create({
            event_id: 1,
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should validate event exists", async () => {
        ;(mockPrisma as MockWithHelpers).addEmployee?.({ id: 1 })
        await expect(
          service.create({
            event_id: 999,
            employee_id: 1,
          } as any)
        ).rejects.toThrow(ValidationError)
      })

      it("should validate employee exists", async () => {
        ;(mockPrisma as MockWithHelpers).addEvent?.({ id: 1 })
        await expect(
          service.create({
            event_id: 1,
            employee_id: 999,
          } as any)
        ).rejects.toThrow(ValidationError)
      })
    })

    describe("uniqueness", () => {
      it("should throw ConflictError on duplicate (event_id, employee_id) on create", async () => {
        const ext = mockPrisma as MockWithHelpers
        ext.addEvent?.({ id: 1 })
        ext.addEmployee?.({ id: 1 })
        await service.create({ event_id: 1, employee_id: 1 } as any)
        await expect(
          service.create({ event_id: 1, employee_id: 1 } as any)
        ).rejects.toThrow(ConflictError)
      })

      it("should throw ConflictError on update when changing to existing (event_id, employee_id)", async () => {
        const ext = mockPrisma as MockWithHelpers
        ext.addEvent?.({ id: 1 })
        ext.addEvent?.({ id: 2 })
        ext.addEmployee?.({ id: 1 })
        const first = await service.create({ event_id: 1, employee_id: 1 } as any)
        await service.create({ event_id: 2, employee_id: 1 } as any)
        await expect(
          service.update(first.id, { event_id: 2, employee_id: 1 } as any)
        ).rejects.toThrow(ConflictError)
      })
    })
  })
})
