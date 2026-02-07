import { describe, it, expect, beforeEach } from "vitest"
import { EventAssignmentController } from "@/server/controllers/EventAssignmentController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEventAssignment } from "../../utils/mockPrismaEventAssignment"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import { NextRequest } from "next/server"
import type { Prisma as PrismaTypes } from "@prisma/client"

type EventAssignmentCreateLike = PrismaTypes.event_assignmentCreateInput & {
  event_id?: number
  employee_id?: number
  id?: number
}

type MockPrismaEventAssignment = MockPrisma & {
  addEvent?: (d: { id?: number }) => void
  addEmployee?: (d: { id?: number }) => void
  addEventAssignment?: (d: {
    id?: number
    event_id: number
    employee_id: number
  }) => PrismaTypes.event_assignmentGetPayload<{}>
}

const abstractTests = createAbstractControllerTests<
  EventAssignmentController,
  PrismaTypes.event_assignmentGetPayload<{}>,
  PrismaTypes.event_assignmentCreateInput,
  PrismaTypes.event_assignmentUpdateInput
>({
  controllerClass: EventAssignmentController,
  modelName: "event_assignment",
  apiPath: "/api/event-assignments",
  createValidInput: () => ({ event_id: 1, employee_id: 1 }),
  createInvalidInput: (): PrismaTypes.event_assignmentCreateInput =>
    ({ event_id: 1 } as PrismaTypes.event_assignmentCreateInput), // missing employee_id for validation test
  createUpdateInput: () => ({ employee_id: 2 }),
  addMockRecord: (
    mockPrisma: MockPrisma,
    data: EventAssignmentCreateLike
  ): PrismaTypes.event_assignmentGetPayload<{}> => {
    const ext = mockPrisma as MockPrismaEventAssignment & {
      _eventAssignmentAddCount?: number
    }
    const dataAny = data as EventAssignmentCreateLike & { active?: boolean }
    let eventId =
      "event_id" in data && data.event_id !== undefined
        ? data.event_id
        : data.event &&
            typeof data.event === "object" &&
            "connect" in data.event
          ? (data.event.connect as { id: number }).id
          : 1
    let employeeId =
      "employee_id" in data && data.employee_id !== undefined
        ? data.employee_id
        : data.employee &&
            typeof data.employee === "object" &&
            "connect" in data.employee
          ? (data.employee.connect as { id: number }).id
          : 1
    if (dataAny.active === false) {
      eventId = 2
      employeeId = 1
    } else {
      ext._eventAssignmentAddCount = (ext._eventAssignmentAddCount ?? 0) + 1
      if (ext._eventAssignmentAddCount === 2) {
        eventId = 2
        employeeId = 1
      }
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
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithEventAssignment(mockPrisma)
    const ext = mockPrisma as MockPrismaEventAssignment
    ext.addEvent?.({ id: 1 })
    ext.addEvent?.({ id: 2 })
    ext.addEmployee?.({ id: 1 })
    ext.addEmployee?.({ id: 2 })
  },
})

describe("EventAssignmentController", () => {
  abstractTests()

  describe("Custom Controller Behavior", () => {
    let mockPrisma: MockPrisma
    let controller: EventAssignmentController

    beforeEach(() => {
      mockPrisma = new MockPrisma()
      extendMockPrismaWithEventAssignment(mockPrisma)
      setMockPrisma(mockPrisma)
      controller = new EventAssignmentController()
    })

    describe("handleGet - filtering", () => {
      it("should filter by event_id", async () => {
        const ext = mockPrisma as MockPrismaEventAssignment
        ext.addEvent?.({ id: 1 })
        ext.addEvent?.({ id: 2 })
        ext.addEmployee?.({ id: 1 })
        ext.addEventAssignment?.({ event_id: 1, employee_id: 1 })
        ext.addEventAssignment?.({ event_id: 2, employee_id: 1 })

        const url = new URL(
          "http://localhost:3000/api/event-assignments?event_id=1"
        )
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = (await response.json()) as PrismaTypes.event_assignmentGetPayload<{}>[]
        expect(Array.isArray(data)).toBe(true)
        expect(data.every((item) => item.event_id === 1)).toBe(true)
      })

      it("should filter by employee_id", async () => {
        const ext = mockPrisma as MockPrismaEventAssignment
        ext.addEvent?.({ id: 1 })
        ext.addEmployee?.({ id: 1 })
        ext.addEmployee?.({ id: 2 })
        ext.addEventAssignment?.({ event_id: 1, employee_id: 1 })
        ext.addEventAssignment?.({ event_id: 1, employee_id: 2 })

        const url = new URL(
          "http://localhost:3000/api/event-assignments?employee_id=1"
        )
        const req = new NextRequest(url)
        const response = await controller.handleGet(req)

        expect(response.status).toBe(200)
        const data = (await response.json()) as PrismaTypes.event_assignmentGetPayload<{}>[]
        expect(Array.isArray(data)).toBe(true)
        expect(data.every((item) => item.employee_id === 1)).toBe(true)
      })
    })

    describe("handleDelete", () => {
      it("should return 204 No Content", async () => {
        const ext = mockPrisma as MockPrismaEventAssignment
        ext.addEvent?.({ id: 1 })
        ext.addEmployee?.({ id: 1 })
        const record = ext.addEventAssignment?.({ event_id: 1, employee_id: 1 })!
        const url = new URL(
          `http://localhost:3000/api/event-assignments/${record.id}`
        )
        const req = new NextRequest(url, { method: "DELETE" })
        const context = { params: Promise.resolve({ id: String(record.id) }) }
        const response = await controller.handleDelete(req, context)
        expect(response.status).toBe(204)
      })
    })
  })
})
