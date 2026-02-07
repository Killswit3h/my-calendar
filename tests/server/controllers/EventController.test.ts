import { describe, it, expect, beforeEach } from "vitest"
import { EventController } from "@/server/controllers/EventController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithEvent } from "../../utils/mockPrismaEvent"
import { setMockPrisma } from "../../utils/mockPrisma"
import { createAbstractControllerTests } from "./AbstractController.test"
import type { Prisma as PrismaTypes } from "@prisma/client"

type EventCreateLike = PrismaTypes.eventCreateInput & {
  project_id?: number
  scope_of_work_id?: number
  payment_type_id?: number
  start_time?: Date | string
  end_time?: Date | string
}
type MockExt = MockPrisma & {
  addProject?: (d: { id?: number }) => void
  addScopeOfWork?: (d: { id?: number }) => void
  addPaymentType?: (d: { id?: number }) => void
  addEvent?: (d: Partial<{
    id: number
    project_id: number
    scope_of_work_id: number
    payment_type_id: number
    start_time: Date
    end_time: Date
  }>) => PrismaTypes.eventGetPayload<{}>
}

function getProjectId(data: EventCreateLike): number {
  const d = data as Record<string, unknown>
  if (typeof d.project_id === "number") return d.project_id
  const p = d.project as { connect?: { id: number } } | undefined
  return p?.connect?.id ?? 1
}
function getScopeOfWorkId(data: EventCreateLike): number {
  const d = data as Record<string, unknown>
  if (typeof d.scope_of_work_id === "number") return d.scope_of_work_id
  const s = d.scope_of_work as { connect?: { id: number } } | undefined
  return s?.connect?.id ?? 1
}
function getPaymentTypeId(data: EventCreateLike): number {
  const d = data as Record<string, unknown>
  if (typeof d.payment_type_id === "number") return d.payment_type_id
  const pt = d.payment_type as { connect?: { id: number } } | undefined
  return pt?.connect?.id ?? 1
}

const abstractTests = createAbstractControllerTests<
  EventController,
  PrismaTypes.eventGetPayload<{}>,
  PrismaTypes.eventCreateInput,
  PrismaTypes.eventUpdateInput
>({
  controllerClass: EventController,
  modelName: "event",
  apiPath: "/api/events",
  createValidInput: (): EventCreateLike => ({
    project_id: 1,
    scope_of_work_id: 1,
    payment_type_id: 1,
    start_time: "2025-02-01T09:00:00Z",
    end_time: "2025-02-01T17:00:00Z",
  }),
  createInvalidInput: (): EventCreateLike => ({
    project_id: 1,
    scope_of_work_id: 1,
    payment_type_id: 1,
    start_time: "2025-02-01T17:00:00Z",
    end_time: "2025-02-01T09:00:00Z", // end before start
  }),
  createUpdateInput: () => ({
    notes: "Updated notes",
    location: "New location",
  }),
  addMockRecord: (
    mockPrisma: MockPrisma,
    data: EventCreateLike
  ): PrismaTypes.eventGetPayload<{}> => {
    const ext = mockPrisma as MockExt
    const projectId = getProjectId(data)
    const scopeOfWorkId = getScopeOfWorkId(data)
    const paymentTypeId = getPaymentTypeId(data)
    ext.addProject?.({ id: projectId })
    ext.addScopeOfWork?.({ id: scopeOfWorkId })
    ext.addPaymentType?.({ id: paymentTypeId })
    const d = data as Record<string, unknown>
    const start_time = d.start_time instanceof Date ? d.start_time : new Date("2025-02-01T09:00:00Z")
    const end_time = d.end_time instanceof Date ? d.end_time : new Date("2025-02-01T17:00:00Z")
    return ext.addEvent!({
      id: "id" in d ? (d.id as number) : undefined,
      project_id: projectId,
      scope_of_work_id: scopeOfWorkId,
      payment_type_id: paymentTypeId,
      start_time,
      end_time,
    }) as PrismaTypes.eventGetPayload<{}>
  },
  getIdFromModel: (model: PrismaTypes.eventGetPayload<{}>) => model.id,
  extendMockPrisma: (mockPrisma: MockPrisma) => {
    extendMockPrismaWithEvent(mockPrisma)
    const ext = mockPrisma as MockExt
    ext.addProject?.({ id: 1 })
    ext.addScopeOfWork?.({ id: 1 })
    ext.addPaymentType?.({ id: 1 })
  },
})

describe("EventController", () => {
  abstractTests()
})
