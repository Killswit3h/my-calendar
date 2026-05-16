import { describe, it, expect, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { ProjectPhaseController } from "@/server/controllers/ProjectPhaseController"
import { MockPrisma } from "../../utils/mockPrisma"
import { extendMockPrismaWithProject } from "../../utils/mockPrismaProject"
import { extendMockPrismaWithProjectPayItem } from "../../utils/mockPrismaProjectPayItem"
import { extendMockPrismaWithProjectPhase } from "../../utils/mockPrismaProjectPhase"
import { setMockPrisma } from "../../utils/mockPrisma"
import { Prisma } from "@prisma/client"

describe("ProjectPhaseController", () => {
  let controller: ProjectPhaseController

  beforeEach(() => {
    const mockPrisma = new MockPrisma()
    extendMockPrismaWithProject(mockPrisma)
    extendMockPrismaWithProjectPayItem(mockPrisma)
    extendMockPrismaWithProjectPhase(mockPrisma)
    setMockPrisma(mockPrisma)
    controller = new ProjectPhaseController()
    ;(mockPrisma as { addProject?: (d: { id?: number }) => void }).addProject?.({ id: 1 })
    ;(mockPrisma as { addProjectPayItem?: (d: Record<string, unknown>) => unknown }).addProjectPayItem?.({
      id: 10,
      project_id: 1,
      pay_item_id: 1,
      contracted_quantity: new Prisma.Decimal(100),
      unit_rate: new Prisma.Decimal(1),
    })
  })

  it("GET returns 404 when project not found", async () => {
    const res = await controller.handleGet(new NextRequest("http://localhost/api/projects/99/phases"), {
      params: Promise.resolve({ id: "99" }),
    })
    expect(res.status).toBe(404)
    const json = (await res.json()) as { error?: string }
    expect(json.error).toBe("NOT_FOUND")
  })

  it("GET returns phases array for project", async () => {
    const res = await controller.handleGet(new NextRequest("http://localhost/api/projects/1/phases"), {
      params: Promise.resolve({ id: "1" }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as { phases: unknown[] }
    expect(Array.isArray(json.phases)).toBe(true)
  })

  it("PUT returns 400 for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/projects/1/phases", {
      method: "PUT",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    })
    const res = await controller.handlePut(req, { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(400)
  })

  it("PUT replaces phases and returns 200", async () => {
    const req = new NextRequest("http://localhost/api/projects/1/phases", {
      method: "PUT",
      body: JSON.stringify({
        phases: [
          {
            sort_order: 0,
            name: "Phase A",
            lines: [{ project_pay_item_id: 10, phase_quantity: 3, sort_order: 0 }],
          },
        ],
      }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await controller.handlePut(req, { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(200)
    const json = (await res.json()) as { phases: Array<{ name: string }> }
    expect(json.phases[0].name).toBe("Phase A")
  })
})
