export type Company = {
  id: string
  name: string
}

export type ProjectType = "HANDRAIL" | "GUARDRAIL" | "FENCE" | "OTHER"
export type ProjectStatus = "Not Started" | "In Progress" | "Completed"

/** Procedure checklist keys match `CHECKLIST_ITEMS` in payApplicationConstants */
export type ProcedureChecklistKey =
  | "contract"
  | "coi"
  | "bond"
  | "material"
  | "eeo"
  | "payroll"

export type ProcedureChecklistStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE"

export type ProcedureChecklist = Partial<
  Record<ProcedureChecklistKey, ProcedureChecklistStatus>
>

export type Project = {
  id: string
  companyId: string
  code: string
  name: string
  status: ProjectStatus
  owner: string
  district: string
  projectType: ProjectType
  procedureChecklist: ProcedureChecklist
  payApplicationNotes: string
  payApplicationInvoiceNumber: string
}

/** Workspace header + detail fields submitted with **Save Project** */
export type ProjectFormState = {
  projectName: string
  code: string
  owner: string
  district: string
  status: string
  payApplicationInvoiceNumber: string
}

export type ProjectPayItemView = {
  id: string
  projectId: string
  payItemId: string
  payItemNumber: string
  payItemDescription: string
  unit: string
  unitRate: number
  contractedQuantity: number
  installedQuantity: number
  stockpileBilled: number
  notes?: string
  beginStation?: string
  endStation?: string
  locateTicket?: string
  lfRt?: string
  onsiteReview?: string
  readyToWorkDate?: string
  statusDate?: string
  surveyed?: boolean
  status?: string
}
