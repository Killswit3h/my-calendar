import { describe, it, expect } from "vitest"
import {
  type ApiProject,
  mapApiProjectToProject,
} from "@/app/projects/mapApiProjectToProject"

function baseApi(overrides: Partial<ApiProject> = {}): ApiProject {
  return {
    id: 1,
    name: "N",
    ...overrides,
  }
}

describe("mapApiProjectToProject", () => {
  it("maps pay_application_invoice_number when string", () => {
    const p = mapApiProjectToProject(
      baseApi({ pay_application_invoice_number: "INV-100" }),
    )
    expect(p.payApplicationInvoiceNumber).toBe("INV-100")
  })

  it("uses empty string when invoice field missing or null", () => {
    expect(mapApiProjectToProject(baseApi()).payApplicationInvoiceNumber).toBe("")
    expect(
      mapApiProjectToProject(baseApi({ pay_application_invoice_number: null }))
        .payApplicationInvoiceNumber,
    ).toBe("")
  })

  it("uses empty string when pay_application_invoice_number is non-string", () => {
    const p = mapApiProjectToProject(
      baseApi({ pay_application_invoice_number: 123 as unknown as string }),
    )
    expect(p.payApplicationInvoiceNumber).toBe("")
  })

  it("maps project_manager_id and branch when present", () => {
    const p = mapApiProjectToProject(
      baseApi({
        project_manager_id: 9,
        branch: "south florida",
      }),
    )
    expect(p.projectManagerId).toBe(9)
    expect(p.branch).toBe("south florida")
  })

  it("falls back PM id from expanded project_manager relation", () => {
    const p = mapApiProjectToProject(
      baseApi({
        project_manager: { id: 42, name: "Alex Example" },
      }),
    )
    expect(p.projectManagerId).toBe(42)
  })
})
