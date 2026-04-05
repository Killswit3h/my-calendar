import { describe, it, expect } from "vitest"
import { CHECKLIST_ITEMS } from "@/components/project/payApplicationConstants"
import type { ChecklistStatus } from "@/components/project/payApplicationTypes"
import type { ProjectFormState } from "@/app/projects/projects.models"
import {
  buildProjectPatchBodyForSave,
  buildProjectPostBodyForSave,
} from "@/app/projects/projectWorkspaceSavePayload"

const blankChecklist = Object.fromEntries(
  CHECKLIST_ITEMS.map(({ key }) => [key, "NOT_STARTED" as ChecklistStatus]),
) as Record<string, ChecklistStatus>

function form(overrides: Partial<ProjectFormState> = {}): ProjectFormState {
  return {
    projectName: "My Project",
    code: "",
    owner: "",
    district: "",
    status: "Not Started",
    payApplicationInvoiceNumber: "",
    ...overrides,
  }
}

describe("buildProjectPatchBodyForSave", () => {
  it("sets pay_application_invoice_number to null when empty or whitespace-only", () => {
    expect(
      (buildProjectPatchBodyForSave(form({ payApplicationInvoiceNumber: "" }), blankChecklist, "") as {
        pay_application_invoice_number: unknown
      }).pay_application_invoice_number,
    ).toBeNull()
    expect(
      (buildProjectPatchBodyForSave(form({ payApplicationInvoiceNumber: "  \t " }), blankChecklist, "") as {
        pay_application_invoice_number: unknown
      }).pay_application_invoice_number,
    ).toBeNull()
  })

  it("trims pay_application_invoice_number", () => {
    const body = buildProjectPatchBodyForSave(
      form({ payApplicationInvoiceNumber: "  INV-7  " }),
      blankChecklist,
      "",
    ) as { pay_application_invoice_number: string }
    expect(body.pay_application_invoice_number).toBe("INV-7")
  })
})

describe("buildProjectPostBodyForSave", () => {
  it("uses undefined invoice field when empty so JSON.stringify drops it on the wire", () => {
    const body = buildProjectPostBodyForSave(form(), blankChecklist, "", {
      customerId: 5,
      projectType: "OTHER",
    }) as Record<string, unknown>
    expect(body.pay_application_invoice_number).toBeUndefined()
    expect(JSON.parse(JSON.stringify(body)).pay_application_invoice_number).toBeUndefined()
  })

  it("includes pay_application_invoice_number when non-empty", () => {
    const body = buildProjectPostBodyForSave(
      form({ payApplicationInvoiceNumber: "  NEW-1 " }),
      blankChecklist,
      "",
      { customerId: 3, projectType: "FENCE" },
    ) as { pay_application_invoice_number: string }
    expect(body.pay_application_invoice_number).toBe("NEW-1")
  })

  it("passes integer customer_id when customerId is valid", () => {
    const body = buildProjectPostBodyForSave(form(), blankChecklist, "", {
      customerId: 12,
      projectType: "OTHER",
    }) as { customer_id: number }
    expect(body.customer_id).toBe(12)
  })

  it("omits customer_id when customerId is not an integer", () => {
    const body = buildProjectPostBodyForSave(form(), blankChecklist, "", {
      customerId: NaN,
      projectType: "OTHER",
    }) as Record<string, unknown>
    expect(body.customer_id).toBeUndefined()
  })
})
