import { CHECKLIST_ITEMS } from "@/components/project/payApplicationConstants"
import type { ChecklistStatus } from "@/components/project/payApplicationTypes"
import type { ProjectFormState, ProjectType } from "./projects.models"

/**
 * PATCH body for project workspace **Save Project** (contract tab state + header).
 */
export function buildProjectPatchBodyForSave(
  payload: ProjectFormState,
  checklist: Record<string, ChecklistStatus>,
  notes: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: payload.projectName.trim(),
    procedure_checklist: Object.fromEntries(
      CHECKLIST_ITEMS.map(({ key }) => [key, checklist[key] ?? "NOT_STARTED"]),
    ),
    pay_application_notes: notes.trim() ? notes.trim() : null,
    project_manager_id:
      typeof payload.projectManagerId === "number" &&
      Number.isInteger(payload.projectManagerId)
        ? payload.projectManagerId
        : null,
    branch:
      typeof payload.branch === "string" && payload.branch.trim()
        ? payload.branch.trim()
        : null,
  }
  const inv = payload.payApplicationInvoiceNumber.trim()
  body.pay_application_invoice_number = inv ? inv : null
  return body
}

export type ProjectPostSaveOptions = {
  /** `Number(company.id)`; omit customer_id when not an integer. */
  customerId: number
  projectType: ProjectType
}

/**
 * POST body for creating a project from the workspace (new project flow).
 */
export function buildProjectPostBodyForSave(
  payload: ProjectFormState,
  checklist: Record<string, ChecklistStatus>,
  notes: string,
  options: ProjectPostSaveOptions,
): Record<string, unknown> {
  const checklistPayload = Object.fromEntries(
    CHECKLIST_ITEMS.map(({ key }) => [key, checklist[key] ?? "NOT_STARTED"]),
  )
  const customerId = options.customerId
  const body: Record<string, unknown> = {
    customer_id: Number.isInteger(customerId) ? customerId : undefined,
    name: payload.projectName.trim(),
    location: "TBD",
    vendor: "TBD",
    retainage: 0,
    project_type: options.projectType,
    procedure_checklist: checklistPayload,
    pay_application_notes: notes.trim() ? notes.trim() : undefined,
    pay_application_invoice_number:
      payload.payApplicationInvoiceNumber.trim() || undefined,
  }

  const pmPost = payload.projectManagerId
  if (
    typeof pmPost === "number" &&
    Number.isInteger(pmPost) &&
    pmPost > 0
  ) {
    body.project_manager_id = pmPost
  }

  const br = typeof payload.branch === "string" ? payload.branch.trim() : ""
  if (br) {
    body.branch = br
  }

  return body
}
