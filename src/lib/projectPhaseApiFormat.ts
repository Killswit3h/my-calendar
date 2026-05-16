import type { ProjectPhaseWithLines } from "@/server/repositories/ProjectPhaseRepository"

function formatDateOnly(d: Date | null): string | null {
  if (!d) return null
  return d.toISOString().slice(0, 10)
}

export type ApiProjectPhaseLine = {
  id: number
  project_pay_item_id: number
  phase_quantity: string
  sort_order: number
  line_description: string | null
}

export type ApiProjectPhase = {
  id: number
  project_id: number
  sort_order: number
  name: string
  locate_ticket: string | null
  date_created: string | null
  ready_to_work_date: string | null
  onsite_review: boolean
  surveyed: boolean
  status: string | null
  status_date: string | null
  notes: string | null
  lines: ApiProjectPhaseLine[]
}

/**
 * JSON-safe phase tree for GET/PUT responses and RSC props.
 */
export function formatPhasesForApi(rows: ProjectPhaseWithLines[]): ApiProjectPhase[] {
  return rows.map((ph) => ({
    id: ph.id,
    project_id: ph.project_id,
    sort_order: ph.sort_order,
    name: ph.name,
    locate_ticket: ph.locate_ticket,
    date_created: formatDateOnly(ph.date_created),
    ready_to_work_date: formatDateOnly(ph.ready_to_work_date),
    onsite_review: ph.onsite_review,
    surveyed: ph.surveyed,
    status: ph.status,
    status_date: formatDateOnly(ph.status_date),
    notes: ph.notes,
    lines: ph.lines.map((line) => ({
      id: line.id,
      project_pay_item_id: line.project_pay_item_id,
      phase_quantity: line.phase_quantity.toString(),
      sort_order: line.sort_order,
      line_description: line.line_description ?? null,
    })),
  }))
}
