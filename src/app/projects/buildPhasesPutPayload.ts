import type { Phase } from "@/components/project/payApplicationTypes"

/**
 * PUT `/api/projects/[id]/phases` body from workspace phase state.
 * Skips lines without a persisted `project_pay_item_id` (e.g. temp pay lines).
 */
export function buildPhasesPutPayload(phases: Phase[]): Record<string, unknown> {
  return {
    phases: phases.map((phase, index) => ({
      sort_order: index,
      name: phase.name.trim(),
      locate_ticket: phase.locateTicket.trim() || null,
      date_created: phase.dateCreated.trim() || null,
      ready_to_work_date: phase.readyToWorkDate.trim() || null,
      onsite_review: phase.onsiteReview,
      surveyed: phase.surveyed,
      status: phase.status.trim() || null,
      status_date: phase.statusDate.trim() || null,
      notes: phase.notes?.trim() ? phase.notes.trim() : null,
      invoice_suffix: (() => {
        const t = phase.invoiceSuffix.trim().toUpperCase()
        return t.length ? t : null
      })(),
      lines: phase.items
        .filter(
          (item) =>
            item.projectPayItemId != null &&
            Number.isInteger(item.projectPayItemId) &&
            item.projectPayItemId > 0,
        )
        .map((item, j) => {
          const desc = (item.lineDescription ?? "").trim()
          return {
            project_pay_item_id: item.projectPayItemId as number,
            phase_quantity: item.quantity,
            sort_order: j,
            line_description: desc.length ? desc : null,
          }
        }),
    })),
  }
}
