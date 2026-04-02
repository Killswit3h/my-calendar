import type { Prisma } from "@prisma/client"
import { getPrisma } from "@/lib/db"
import type { QuantityItem } from "@/components/project/ProjectQuantitiesCard"
import { mapPayRollupRow, toRollupNumber } from "./projectPayRollupMapping"
import type { ProjectPayItemView } from "./projects.models"

type ProjectPayItemWithPayItem = Prisma.project_pay_itemGetPayload<{
  include: { pay_item: true }
}>

/**
 * Loads project pay lines and installed quantity rollups for the project workspace (server-only).
 * Uses Prisma directly so the RSC does not depend on HTTP self-fetch to /api/project-pay-items.
 */
export async function loadProjectPayItemsWithRollups(
  projectId: string,
): Promise<{ projectPayItems: ProjectPayItemView[]; quantityItems: QuantityItem[] }> {
  const idNum = Number.parseInt(projectId, 10)
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return { projectPayItems: [], quantityItems: [] }
  }

  const prisma = await getPrisma()
  const rows = await prisma.project_pay_item.findMany({
    where: { project_id: idNum },
    include: { pay_item: true },
    orderBy: { id: "asc" },
  })

  const ppiIds = rows.map((r: ProjectPayItemWithPayItem) => r.id)
  const quantities =
    ppiIds.length === 0
      ? []
      : await prisma.event_quantity.findMany({
          where: { project_pay_item_id: { in: ppiIds } },
        })

  const installedByPpi = new Map<number, number>()
  for (const q of quantities) {
    const prev = installedByPpi.get(q.project_pay_item_id) ?? 0
    installedByPpi.set(q.project_pay_item_id, prev + toRollupNumber(q.quantity))
  }

  const rollupList = rows.map((row: ProjectPayItemWithPayItem) =>
    mapPayRollupRow(row, installedByPpi.get(row.id) ?? 0),
  )

  return {
    projectPayItems: rollupList.map(
      (e: { projectPayItem: ProjectPayItemView }) => e.projectPayItem,
    ),
    quantityItems: rollupList.map((e: { quantityItem: QuantityItem }) => e.quantityItem),
  }
}
