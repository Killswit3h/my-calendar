export type FinanceWarning =
  | "NO_EMPLOYEES_ASSIGNED"
  | "MISSING_HOURLY_RATE"
  | "ZERO_HOURS_COMPUTED"
  | "NO_EVENTS_LINKED"
  | "BROKEN_DETAILS_LINK"
  | "INVALID_EVENT_DATES";

export interface FinanceJobRow {
  jobId?: string;
  jobSlug?: string | null;
  jobName: string;
  customerName?: string | null;
  crewCount: number;
  totalDays: number;
  totalHours: number;
  totalLaborCost: number;
  warnings: { code: FinanceWarning; detail: string }[];
  detailsUrl?: string;
}
