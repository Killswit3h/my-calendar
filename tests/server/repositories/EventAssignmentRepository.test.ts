import { describe, it, expect, beforeEach } from "vitest"
import { EventAssignmentRepository } from "@/server/repositories/EventAssignmentRepository"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEventAssignment } from "../../utils/mockPrismaEventAssignment"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractRepositoryTests } from "./AbstractRepository.test"
import type { Prisma as PrismaTypes } from "@prisma/client"

type Ext = MockPrisma & {
  addEvent?: (d: { id?: number }) => void
  addEmployee?: (d: { id?: number }) => void
  addEventAssignment?: (d: {
    id?: number
    event_id: number
    employee_id: number
  }) => PrismaTypes.event_assignmentGetPayload<{}>
  _eventAssignmentAddCount?: number
}

const abstractTests = createAbstractRepositoryTests<
  EventAssignmentRepository,
  PrismaTypes.event_assignmentGetPayload<{}>,
  PrismaTypes.event_assignmentCreateInput,
  PrismaTypes.event_assignmentUpdateInput,
  PrismaTypes.event_assignmentWhereUniqueInput,
  PrismaTypes.event_assignmentWhereInput
>({
  repositoryClass: EventAssignmentRepository,
  modelName: "event_assignment",
  createValidInput: () => ({
    event: { connect: { id: 1 } },
    employee: { connect: { id: 1 } },
  }),
  createUpdateInput: () => ({
    employee: { connect: { id: 2 } },
  }),
  createUniqueInput: (id: number) => ({ id }),
  createWhereInput: (filters: PrismaTypes.event_assignmentWhereInput) =>
    filters,
  addMockRecord: (
    mockPrisma: MockPrisma,
    data:
      | PrismaTypes.event_assignmentCreateInput
      | Partial<PrismaTypes.event_assignmentGetPayload<{}>>
  ): PrismaTypes.event_assignmentGetPayload<{}> => {
    const ext = mockPrisma as Ext & { active?: boolean }
    ext._eventAssignmentAddCount = (ext._eventAssignmentAddCount ?? 0) + 1
    const n = ext._eventAssignmentAddCount
    let eventId = 1
    let employeeId = 1
    if ((data as { active?: boolean }).active === false || n === 2) {
      eventId = 2
      employeeId = 1
    } else if (n > 2) {
      eventId = n
      employeeId = 1
    } else if (
      "event" in data &&
      data.event &&
      typeof data.event === "object" &&
      "connect" in data.event
    ) {
      eventId = (data.event.connect as { id: number }).id
    }
    if (
      "employee" in data &&
      data.employee &&
      typeof data.employee === "object" &&
      "connect" in data.employee
    ) {
      employeeId = (data.employee.connect as { id: number }).id
    }
    ext.addEvent?.({ id: eventId })
    ext.addEmployee?.({ id: employeeId })
    return ext.addEventAssignment!({
      id: "id" in data ? data.id : undefined,
      event_id: eventId,
      employee_id: employeeId,
    })
  },
  getIdFromModel: (model: PrismaTypes.event_assignmentGetPayload<{}>) =>
    model.id,
  idField: "id",
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithEventAssignment(mockPrisma)
    const ext = mockPrisma as Ext
    ext.addEvent?.({ id: 1 })
    ext.addEvent?.({ id: 2 })
    ext.addEmployee?.({ id: 1 })
    ext.addEmployee?.({ id: 2 })
  },
})

describe("EventAssignmentRepository", () => {
  abstractTests()

  describe("Custom Methods", () => {
    let mockPrisma: MockPrisma
    let repository: EventAssignmentRepository

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithEventAssignment(mockPrisma)
      setMockPrisma(mockPrisma)
      repository = new EventAssignmentRepository()
    })

    const ext = (): Ext => mockPrisma as Ext

    describe("findByEventId", () => {
      it("should find event assignments by event ID", async () => {
        ext().addEvent?.({ id: 1 })
        ext().addEvent?.({ id: 2 })
        ext().addEmployee?.({ id: 1 })
        ext().addEventAssignment?.({ event_id: 1, employee_id: 1 })
        ext().addEventAssignment?.({ event_id: 1, employee_id: 2 })
        ext().addEventAssignment?.({ event_id: 2, employee_id: 1 })

        const result = await repository.findByEventId(1)
        expect(result).toBeTruthy()
        expect(result.length).toBe(2)
        expect(result.every((item) => item.event_id === 1)).toBe(true)
      })

      it("should return empty array when no assignments found", async () => {
        const result = await repository.findByEventId(999)
        expect(result).toEqual([])
      })
    })

    describe("findByEmployeeId", () => {
      it("should find event assignments by employee ID", async () => {
        ext().addEvent?.({ id: 1 })
        ext().addEvent?.({ id: 2 })
        ext().addEmployee?.({ id: 1 })
        ext().addEmployee?.({ id: 2 })
        ext().addEventAssignment?.({ event_id: 1, employee_id: 1 })
        ext().addEventAssignment?.({ event_id: 2, employee_id: 1 })
        ext().addEventAssignment?.({ event_id: 1, employee_id: 2 })

        const result = await repository.findByEmployeeId(1)
        expect(result).toBeTruthy()
        expect(result.length).toBe(2)
        expect(result.every((item) => item.employee_id === 1)).toBe(true)
      })

      it("should return empty array when no assignments found", async () => {
        const result = await repository.findByEmployeeId(999)
        expect(result).toEqual([])
      })
    })

    describe("findFirstByEventAndEmployee", () => {
      it("should return assignment when found", async () => {
        ext().addEvent?.({ id: 1 })
        ext().addEmployee?.({ id: 1 })
        ext().addEventAssignment?.({ event_id: 1, employee_id: 1 })

        const result = await repository.findFirstByEventAndEmployee(1, 1)
        expect(result).toBeTruthy()
        expect(result!.event_id).toBe(1)
        expect(result!.employee_id).toBe(1)
      })

      it("should return null when no assignment found", async () => {
        const result = await repository.findFirstByEventAndEmployee(1, 1)
        expect(result).toBeNull()
      })
    })
  })
})
