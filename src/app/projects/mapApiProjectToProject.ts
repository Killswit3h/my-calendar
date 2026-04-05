import { CHECKLIST_ITEMS } from "@/components/project/payApplicationConstants"
import type {
  ProcedureChecklist,
  ProcedureChecklistKey,
  ProcedureChecklistStatus,
  Project,
  ProjectStatus,
  ProjectType,
} from "./projects.models"

export type ApiProject = {
  id: number
  customer_id?: number | null
  name: string
  code?: string | null
  owner?: string | null
  district?: string | null
  project_type?: string | null
  status?: string | null
  customer?: { id: number; name: string } | null
  procedure_checklist?: unknown
  pay_application_notes?: string | null
  pay_application_invoice_number?: string | null
}

const STATUS_MAP: Record<string, ProjectStatus> = {
  "Not Started": "Not Started",
  "In Progress": "In Progress",
  Completed: "Completed",
  ACTIVE: "In Progress",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
}

function normalizeStatus(status: string | null | undefined): ProjectStatus {
  if (!status) return "Not Started"
  return STATUS_MAP[status] ?? "Not Started"
}

function normalizeProjectType(projectType: string | null | undefined): ProjectType {
  const value = (projectType ?? "").trim().toUpperCase()
  if (value === "HANDRAIL" || value === "GUARDRAIL" || value === "FENCE") {
    return value
  }
  return "OTHER"
}

const CHECKLIST_STATUSES: ProcedureChecklistStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETE",
]

function parseProcedureChecklist(raw: unknown): ProcedureChecklist {
  const out: ProcedureChecklist = {}
  for (const { key } of CHECKLIST_ITEMS) {
    out[key as ProcedureChecklistKey] = "NOT_STARTED"
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>
    for (const { key } of CHECKLIST_ITEMS) {
      const v = obj[key]
      if (typeof v === "string" && CHECKLIST_STATUSES.includes(v as ProcedureChecklistStatus)) {
        out[key as ProcedureChecklistKey] = v as ProcedureChecklistStatus
      }
    }
  }
  return out
}

/** Maps a `/api/projects` row into the workspace `Project` view model. */
export function mapApiProjectToProject(project: ApiProject): Project {
  const companyId = String(project.customer_id ?? project.customer?.id ?? "unassigned")
  return {
    id: String(project.id),
    companyId,
    code: project.code?.trim() || "",
    name: project.name,
    status: normalizeStatus(project.status),
    owner: project.owner?.trim() || "",
    district: project.district?.trim() || "",
    projectType: normalizeProjectType(project.project_type),
    procedureChecklist: parseProcedureChecklist(project.procedure_checklist),
    payApplicationNotes:
      typeof project.pay_application_notes === "string" ? project.pay_application_notes : "",
    payApplicationInvoiceNumber:
      typeof project.pay_application_invoice_number === "string"
        ? project.pay_application_invoice_number
        : "",
  }
}
