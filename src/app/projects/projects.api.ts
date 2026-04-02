import { getBaseUrl } from "@/lib/base-url"
import type { QuantityItem } from "@/components/project/ProjectQuantitiesCard"
import { mapPayRollupRow, toRollupNumber } from "./projectPayRollupMapping"
import { CHECKLIST_ITEMS } from "@/components/project/payApplicationConstants"
import type {
  Company,
  ProcedureChecklist,
  ProcedureChecklistKey,
  ProcedureChecklistStatus,
  Project,
  ProjectPayItemView,
  ProjectStatus,
  ProjectType,
} from "./projects.models"

type ApiProject = {
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
}

type ApiPayItem = {
  id: number
  number: string
  description: string
  unit: string
}

type ApiProjectPayItem = {
  id: number
  project_id: number
  pay_item_id?: number | null
  line_item_number?: string | null
  line_item_description?: string | null
  line_item_unit?: string | null
  contracted_quantity: string | number
  stockpile_billed?: string | number | null
  unit_rate?: string | number | null
  notes?: string | null
  begin_station?: string | null
  end_station?: string | null
  locate_ticket?: string | null
  LF_RT?: string | null
  onsite_review?: string | null
  ready_to_work_date?: string | null
  status_date?: string | null
  surveyed?: boolean | null
  status?: string | null
  pay_item?: ApiPayItem | null
}

type ApiEventQuantity = {
  id: number
  project_pay_item_id: number
  quantity: string | number
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

function mapProject(project: ApiProject): Project {
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
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({}))
  if (body && typeof body === "object" && typeof (body as { message?: string }).message === "string") {
    return (body as { message: string }).message
  }
  return `Request failed (${response.status})`
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Failed request for ${path}: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function fetchCustomers(): Promise<Company[]> {
  const rows = await fetchJson<Array<{ id: number; name: string }>>("/api/customers")
  return rows.map((customer) => ({
    id: String(customer.id),
    name: customer.name,
  }))
}

export async function fetchProjects(): Promise<{ projects: Project[]; companies: Company[] }> {
  const [rows, customers] = await Promise.all([
    fetchJson<ApiProject[]>("/api/projects?expanded=true"),
    fetchCustomers(),
  ])
  const projects = rows.map(mapProject)
  const companyLookup = new Map<string, Company>(customers.map((customer) => [customer.id, customer]))

  for (const row of rows) {
    if (row.customer && row.customer.id) {
      companyLookup.set(String(row.customer.id), {
        id: String(row.customer.id),
        name: row.customer.name,
      })
    }
  }

  for (const project of projects) {
    if (!project.companyId) continue
    if (!companyLookup.has(project.companyId)) {
      companyLookup.set(project.companyId, {
        id: project.companyId,
        name: `Customer ${project.companyId}`,
      })
    }
  }

  return {
    projects,
    companies: Array.from(companyLookup.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  }
}

export async function fetchProjectById(id: string): Promise<{ project: Project; company: Company }> {
  const row = await fetchJson<ApiProject>(`/api/projects/${id}?expanded=true`)
  const project = mapProject(row)
  const company: Company = {
    id: project.companyId || String(row.customer?.id ?? ""),
    name: row.customer?.name ?? `Customer ${project.companyId || ""}`,
  }
  return { project, company }
}

async function fetchEventQuantitiesForProjectPayItem(
  projectPayItemId: string,
): Promise<ApiEventQuantity[]> {
  return fetchJson<ApiEventQuantity[]>(
    `/api/event-quantities?project_pay_item_id=${encodeURIComponent(projectPayItemId)}`,
  )
}

export async function fetchProjectPayItemsWithRollups(
  projectId: string,
): Promise<{ projectPayItems: ProjectPayItemView[]; quantityItems: QuantityItem[] }> {
  const rows = await fetchJson<ApiProjectPayItem[]>(
    `/api/project-pay-items?project_id=${encodeURIComponent(projectId)}&expanded=true`,
  )

  const rollupList = await Promise.all(
    rows.map(async (row) => {
      const quantities = await fetchEventQuantitiesForProjectPayItem(String(row.id))
      const installedQuantity = quantities.reduce(
        (sum, quantityRow) => sum + toRollupNumber(quantityRow.quantity),
        0,
      )
      return mapPayRollupRow(row, installedQuantity)
    }),
  )

  return {
    projectPayItems: rollupList.map((entry) => entry.projectPayItem),
    quantityItems: rollupList.map((entry) => entry.quantityItem),
  }
}

export async function patchProjectApi(
  id: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }
  return response.json()
}

export async function postProjectPayItemApi(
  body: Record<string, unknown>,
): Promise<{ id: number } & Record<string, unknown>> {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/project-pay-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }
  return response.json() as Promise<{ id: number } & Record<string, unknown>>
}

export async function patchProjectPayItemApi(
  id: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/project-pay-items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }
  return response.json()
}

export async function deleteProjectPayItemApi(id: string): Promise<void> {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/project-pay-items/${encodeURIComponent(id)}`, {
    method: "DELETE",
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }
}
