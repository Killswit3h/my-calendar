import { APP_TZ, formatInTimeZone } from '@/lib/timezone'

export interface EventSegment {
  eventId: string
  start: Date
  end: Date
  hours: number
  isAllDay: boolean
  dayKey: string
  index: number
  isFirstSegment: boolean
  isLastSegment: boolean
}

export interface HoursAssignmentInput {
  id: string
  eventId: string
  employeeId: string
  dayOverride: Date | null
  hours: any | number | null
}

export const toDayKey = (date: Date) => formatInTimeZone(date, APP_TZ).date

export const deriveEventSegments = (event: any): EventSegment[] => {
  return []
}

export const hoursForAssignment = (segment: EventSegment, assignment: HoursAssignmentInput): number => {
  return 0
}

export interface FinanceLaborEmployee {
  id: string
  employeeId: string
  name: string
  totalHours: number
  totalCost: number
}

export interface FinanceLaborProject {
  id: string
  projectId: string
  projectKey: string
  name: string
  projectName: string
  customerName: string | null
  totalHours: number
  totalCost: number
  employees: FinanceLaborEmployee[]
  firstEvent: string
  lastEvent: string
  warnings: string[]
}

export interface FinanceLaborResponse {
  projects: FinanceLaborProject[]
  totals: {
    totalHours: number
    totalCost: number
  }
  range: {
    from: string
    to: string
  }
  summary: {
    projects: number
    employees: number
    warnings: number
  }
}

export const aggregateByProject = ({ from, to, prisma }: any): Promise<FinanceLaborResponse> => {
  return Promise.resolve({
    projects: [],
    totals: { totalHours: 0, totalCost: 0 },
    range: { from: from || '', to: to || '' },
    summary: { projects: 0, employees: 0, warnings: 0 }
  })
}

export const resolveRange = (from?: string, to?: string): any => {
  return { from: from || '', to: to || '' }
}
