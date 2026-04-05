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
})
