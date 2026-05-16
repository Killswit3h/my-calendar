import type { ApiProjectPhase } from "@/lib/projectPhaseApiFormat"
import type { Phase } from "@/components/project/payApplicationTypes"
import type { ProjectPayItemView } from "./projects.models"

/**
 * Maps persisted API phases + current pay lines into workspace `Phase[]` (installed qty from pay lines).
 */
export function mapApiPhasesToWorkspacePhases(
  apiPhases: ApiProjectPhase[],
  payLines: ProjectPayItemView[],
): Phase[] {
  const payByNumericId = new Map<number, ProjectPayItemView>()
  for (const line of payLines) {
    const n = Number(line.id)
    if (Number.isInteger(n) && n > 0) {
      payByNumericId.set(n, line)
    }
  }

  const sorted = [...apiPhases].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.id - b.id
  })

  return sorted.map((ph) => ({
    id: String(ph.id),
    name: ph.name,
    invoiceSuffix: "",
    locateTicket: ph.locate_ticket ?? "",
    dateCreated: ph.date_created ?? "",
    readyToWorkDate: ph.ready_to_work_date ?? "",
    onsiteReview: ph.onsite_review,
    surveyed: ph.surveyed,
    status: ph.status ?? "Pending",
    statusDate: ph.status_date ?? "",
    notes: ph.notes ?? "",
    items: [...ph.lines]
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
        return a.id - b.id
      })
      .map((line) => {
        const row = payByNumericId.get(line.project_pay_item_id)
        const qty = Number(line.phase_quantity)
        return {
          id: `phase-line-${line.id}`,
          projectPayItemId: line.project_pay_item_id,
          payItem: row?.payItemNumber ?? `Pay item #${line.project_pay_item_id}`,
          description: row?.payItemDescription ?? "",
          lineDescription: line.line_description?.trim() ? line.line_description.trim() : "",
          contractedQuantity: row?.contractedQuantity ?? 0,
          quantity: Number.isFinite(qty) ? qty : 0,
          installedQty: row?.installedQuantity ?? 0,
        }
      }),
  }))
}
