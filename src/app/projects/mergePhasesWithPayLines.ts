import type { Phase } from "@/components/project/payApplicationTypes"
import type { ProjectPayItemView } from "./projects.models"

/**
 * Refreshes display fields from current pay lines (installed qty, labels) without mutating phase ids.
 */
export function mergePhasesWithPayLines(
  phases: Phase[],
  payLines: ProjectPayItemView[],
): Phase[] {
  const payByNumericId = new Map<number, ProjectPayItemView>()
  for (const line of payLines) {
    const n = Number(line.id)
    if (Number.isInteger(n) && n > 0) {
      payByNumericId.set(n, line)
    }
  }

  return phases.map((phase) => ({
    ...phase,
    items: phase.items.map((item) => {
      if (item.projectPayItemId == null) {
        return item
      }
      const row = payByNumericId.get(item.projectPayItemId)
      if (!row) {
        return item
      }
      return {
        ...item,
        payItem: row.payItemNumber,
        description: row.payItemDescription,
        installedQty: row.installedQuantity,
        contractedQuantity: row.contractedQuantity,
      }
    }),
  }))
}
