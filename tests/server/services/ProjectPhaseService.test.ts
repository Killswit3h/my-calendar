import { describe, it, expect, beforeEach } from "vitest"
import { ProjectPhaseService } from "@/server/services/ProjectPhaseService"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithProject } from "../../utils/mockPrismaProject"
import { extendMockPrismaWithProjectPayItem } from "../../utils/mockPrismaProjectPayItem"
import { extendMockPrismaWithProjectPhase } from "../../utils/mockPrismaProjectPhase"
import { setMockPrisma } from "../../utils/mockPrisma"
import { NotFoundError, ValidationError } from "@/server/base/types"
import { Prisma } from "@prisma/client"

describe("ProjectPhaseService", () => {
  let mockPrisma: MockPrisma
  let service: ProjectPhaseService

  beforeEach(() => {
    mockPrisma = new MockPrisma()
    extendMockPrismaWithProject(mockPrisma)
    extendMockPrismaWithProjectPayItem(mockPrisma)
    extendMockPrismaWithProjectPhase(mockPrisma)
    setMockPrisma(mockPrisma)
    service = new ProjectPhaseService()
    ;(mockPrisma as { addProject?: (d: { id?: number }) => void }).addProject?.({ id: 1 })
    ;(mockPrisma as { addProjectPayItem?: (d: Record<string, unknown>) => unknown }).addProjectPayItem?.({
      id: 10,
      project_id: 1,
      pay_item_id: 1,
      contracted_quantity: new Prisma.Decimal(100),
      unit_rate: new Prisma.Decimal(1),
    })
  })

  it("listForProject throws NotFoundError when project missing", async () => {
    await expect(service.listForProject(999)).rejects.toThrow(NotFoundError)
  })

  it("listForProject returns empty phases when none stored", async () => {
    const rows = await service.listForProject(1)
    expect(rows).toEqual([])
  })

  it("replaceForProject allows same project_pay_item_id in different phases when sum within contracted", async () => {
    const body = {
      phases: [
        {
          sort_order: 0,
          name: "A",
          lines: [{ project_pay_item_id: 10, phase_quantity: 40, sort_order: 0, line_description: "slice A" }],
        },
        {
          sort_order: 1,
          name: "B",
          lines: [{ project_pay_item_id: 10, phase_quantity: 60, sort_order: 0 }],
        },
      ],
    }
    const rows = await service.replaceForProject(1, body)
    expect(rows).toHaveLength(2)
    expect(rows[0].lines[0].project_pay_item_id).toBe(10)
    expect(rows[1].lines[0].project_pay_item_id).toBe(10)
    expect(rows[0].lines[0].line_description).toBe("slice A")
  })

  it("replaceForProject throws when duplicate project_pay_item_id in same phase", async () => {
    const body = {
      phases: [
        {
          sort_order: 0,
          name: "A",
          lines: [
            { project_pay_item_id: 10, phase_quantity: 1, sort_order: 0 },
            { project_pay_item_id: 10, phase_quantity: 2, sort_order: 1 },
          ],
        },
      ],
    }
    await expect(service.replaceForProject(1, body)).rejects.toThrow(ValidationError)
  })

  it("replaceForProject throws when phase quantities exceed contracted_quantity", async () => {
    const body = {
      phases: [
        {
          sort_order: 0,
          name: "A",
          lines: [{ project_pay_item_id: 10, phase_quantity: 70, sort_order: 0 }],
        },
        {
          sort_order: 1,
          name: "B",
          lines: [{ project_pay_item_id: 10, phase_quantity: 40, sort_order: 0 }],
        },
      ],
    }
    await expect(service.replaceForProject(1, body)).rejects.toThrow(ValidationError)
  })

  it("replaceForProject throws when pay item belongs to another project", async () => {
    ;(mockPrisma as { addProjectPayItem?: (d: Record<string, unknown>) => unknown }).addProjectPayItem?.({
      id: 11,
      project_id: 2,
      pay_item_id: 1,
      contracted_quantity: new Prisma.Decimal(50),
      unit_rate: new Prisma.Decimal(1),
    })
    ;(mockPrisma as { addProject?: (d: { id?: number }) => void }).addProject?.({ id: 2 })
    const body = {
      phases: [
        {
          sort_order: 0,
          name: "A",
          lines: [{ project_pay_item_id: 11, phase_quantity: 1, sort_order: 0 }],
        },
      ],
    }
    await expect(service.replaceForProject(1, body)).rejects.toThrow(ValidationError)
  })

  it("replaceForProject replaces phases and returns persisted tree", async () => {
    const body = {
      phases: [
        {
          sort_order: 0,
          name: "Phase 1",
          locate_ticket: "T-1",
          date_created: "2025-06-01",
          ready_to_work_date: null,
          onsite_review: true,
          surveyed: false,
          status: "Ready",
          status_date: "2025-06-02",
          notes: "note",
          lines: [{ project_pay_item_id: 10, phase_quantity: 25.5, sort_order: 0 }],
        },
      ],
    }
    const rows = await service.replaceForProject(1, body)
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe("Phase 1")
    expect(rows[0].lines).toHaveLength(1)
    expect(rows[0].lines[0].project_pay_item_id).toBe(10)
    expect(rows[0].lines[0].phase_quantity.toString()).toBe("25.5")

    const again = await service.listForProject(1)
    expect(again).toHaveLength(1)
  })

  it("replaceForProject clears phases when empty array sent", async () => {
    await service.replaceForProject(1, {
      phases: [
        {
          sort_order: 0,
          name: "P",
          lines: [{ project_pay_item_id: 10, phase_quantity: 1, sort_order: 0 }],
        },
      ],
    })
    const cleared = await service.replaceForProject(1, { phases: [] })
    expect(cleared).toHaveLength(0)
  })
})
