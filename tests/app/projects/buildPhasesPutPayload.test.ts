import { describe, it, expect } from "vitest"
import { buildPhasesPutPayload } from "@/app/projects/buildPhasesPutPayload"
import type { Phase } from "@/components/project/payApplicationTypes"

describe("buildPhasesPutPayload", () => {
  it("maps phases and skips items without projectPayItemId", () => {
    const phases: Phase[] = [
      {
        id: "1",
        name: " P1 ",
        locateTicket: "  ",
        dateCreated: "",
        readyToWorkDate: "2025-01-02",
        invoiceSuffix: "  ab  ",
        onsiteReview: true,
        surveyed: false,
        status: " Ready ",
        statusDate: "",
        notes: "  hi  ",
        items: [
          {
            id: "a",
            projectPayItemId: 10,
            payItem: "x",
            description: "d",
            lineDescription: "  phase note  ",
            contractedQuantity: 100,
            quantity: 5,
            installedQty: 1,
          },
          {
            id: "b",
            projectPayItemId: null,
            payItem: "y",
            description: "d2",
            lineDescription: "",
            contractedQuantity: 0,
            quantity: 9,
            installedQty: 0,
          },
        ],
      },
    ]
    const body = buildPhasesPutPayload(phases) as { phases: Array<Record<string, unknown>> }
    expect(body.phases).toHaveLength(1)
    const p = body.phases[0]
    expect(p.name).toBe("P1")
    expect(p.locate_ticket).toBeNull()
    expect(p.ready_to_work_date).toBe("2025-01-02")
    expect(p.invoice_suffix).toBe("AB")
    expect(p.notes).toBe("hi")
    const lines = p.lines as Array<Record<string, unknown>>
    expect(lines).toHaveLength(1)
    expect(lines[0].project_pay_item_id).toBe(10)
    expect(lines[0].phase_quantity).toBe(5)
    expect(lines[0].line_description).toBe("phase note")
  })

  it("omits line_description content when phase line description is blank", () => {
    const phases: Phase[] = [
      {
        id: "1",
        name: "P1",
        locateTicket: "",
        dateCreated: "",
        readyToWorkDate: "",
        invoiceSuffix: "",
        onsiteReview: false,
        surveyed: false,
        status: "Pending",
        statusDate: "",
        notes: "",
        items: [
          {
            id: "a",
            projectPayItemId: 10,
            payItem: "x",
            description: "d",
            lineDescription: "   ",
            contractedQuantity: 1,
            quantity: 1,
            installedQty: 0,
          },
        ],
      },
    ]
    const body = buildPhasesPutPayload(phases) as { phases: Array<Record<string, unknown>> }
    const lines = body.phases[0].lines as Array<Record<string, unknown>>
    expect(lines[0].line_description).toBeNull()
  })
})
