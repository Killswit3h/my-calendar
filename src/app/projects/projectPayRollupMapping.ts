import type { QuantityItem } from "@/components/project/ProjectQuantitiesCard"
import type { ProjectPayItemView } from "./projects.models"

/** Accepts API JSON, Prisma decimals, or plain numbers/strings */
export function toRollupNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (value === null || value === undefined) return 0
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : 0
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function formatIsoDate(value: string | Date | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === "string") return value
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString()
  return undefined
}

export type PayRollupRowInput = {
  id: number
  project_id: number
  pay_item_id?: number | null
  line_item_number?: string | null
  line_item_description?: string | null
  line_item_unit?: string | null
  contracted_quantity: unknown
  unit_rate?: unknown
  stockpile_billed?: unknown
  notes?: string | null
  begin_station?: string | null
  end_station?: string | null
  locate_ticket?: string | null
  LF_RT?: string | null
  onsite_review?: string | null
  ready_to_work_date?: string | Date | null
  status_date?: string | Date | null
  surveyed?: boolean | null
  status?: string | null
  pay_item?: { number: string; description: string; unit: string } | null
}

export function mapPayRollupRow(
  row: PayRollupRowInput,
  installedQuantity: number,
): { projectPayItem: ProjectPayItemView; quantityItem: QuantityItem } {
  const lineNum = row.line_item_number?.trim() ?? ""
  const payItemNumber =
    lineNum ||
    row.pay_item?.number ||
    (row.pay_item_id != null ? `Pay Item ${row.pay_item_id}` : "Line item")
  const payItemDescription =
    (row.line_item_description != null && row.line_item_description !== ""
      ? row.line_item_description
      : row.pay_item?.description) ?? ""
  const unit =
    (row.line_item_unit != null && row.line_item_unit !== ""
      ? row.line_item_unit
      : row.pay_item?.unit) ?? ""

  const projectPayItem: ProjectPayItemView = {
    id: String(row.id),
    projectId: String(row.project_id),
    payItemId: row.pay_item_id != null ? String(row.pay_item_id) : "",
    payItemNumber,
    payItemDescription,
    unit,
    unitRate: toRollupNumber(row.unit_rate),
    contractedQuantity: toRollupNumber(row.contracted_quantity),
    installedQuantity,
    stockpileBilled: toRollupNumber(row.stockpile_billed),
    notes: row.notes ?? undefined,
    beginStation: row.begin_station ?? undefined,
    endStation: row.end_station ?? undefined,
    locateTicket: row.locate_ticket ?? undefined,
    lfRt: row.LF_RT ?? undefined,
    onsiteReview: row.onsite_review ?? undefined,
    readyToWorkDate: formatIsoDate(row.ready_to_work_date),
    statusDate: formatIsoDate(row.status_date),
    surveyed: row.surveyed ?? undefined,
    status: row.status ?? undefined,
  }

  const quantityItem: QuantityItem = {
    id: String(row.id),
    payItem: payItemNumber,
    description: payItemDescription,
    contractQty: toRollupNumber(row.contracted_quantity),
    installedQty: installedQuantity,
  }

  return { projectPayItem, quantityItem }
}
