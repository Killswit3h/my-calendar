// Local type definition since AccessArea doesn't exist in Prisma schema
export type AccessArea = 
  | 'ADMIN' 
  | 'CALENDAR' 
  | 'REPORTS' 
  | 'FINANCE' 
  | 'PAYROLL' 
  | 'SETTINGS'
  | 'REPORTS_DAILY'
  | 'REPORTS_WEEKLY'
  | 'REPORTS_FINANCE'
  | 'REPORTS_EXPORTS'

export const REPORT_ACCESS_AREAS: { key: AccessArea; label: string; description: string }[] = [
  { key: 'REPORTS_DAILY', label: 'Daily', description: 'Daily PDF snapshots' },
  { key: 'REPORTS_WEEKLY', label: 'Weekly', description: 'Weekly summaries' },
  { key: 'REPORTS_FINANCE', label: 'Finance', description: 'Finance dashboards' },
  { key: 'REPORTS_EXPORTS', label: 'Exports', description: 'Bulk exports' },
]










