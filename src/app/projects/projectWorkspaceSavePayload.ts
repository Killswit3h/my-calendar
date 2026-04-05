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
    status: payload.status.trim(),
    procedure_checklist: Object.fromEntries(
      CHECKLIST_ITEMS.map(({ key }) => [key, checklist[key] ?? "NOT_STARTED"]),
    ),
    pay_application_notes: notes.trim() ? notes.trim() : null,
  }
  const code = payload.code.trim()
  if (code) body.code = code
  const owner = payload.owner.trim()
  if (owner) body.owner = owner
  const district = payload.district.trim()
  if (district) body.district = district
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
  return {
    customer_id: Number.isInteger(customerId) ? customerId : undefined,
    name: payload.projectName.trim(),
    code: payload.code.trim() || undefined,
    owner: payload.owner.trim() || undefined,
    district: payload.district.trim() || undefined,
    project_type: options.projectType,
    status: payload.status,
    location: "TBD",
    vendor: payload.owner.trim() || "TBD",
    retainage: 0,
    procedure_checklist: checklistPayload,
    pay_application_notes: notes.trim() ? notes.trim() : undefined,
    pay_application_invoice_number:
      payload.payApplicationInvoiceNumber.trim() || undefined,
  }
}
