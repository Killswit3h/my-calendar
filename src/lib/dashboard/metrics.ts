import { cache } from 'react'

import { getPrisma } from '@/lib/db'
import type { ActionQueueGroup } from './types'

export type DashboardMetrics = {
  jobsActive: number
  invoicesPending: number
  inventoryLowStock: number
  crewHoursThisWeek: number
  projectsBehindSchedule: number
  safetyAlertsOpen: number
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getUTCDay()
  const diff = (day + 6) % 7
  copy.setUTCDate(copy.getUTCDate() - diff)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 7)
  return end
}

type InventorySnapshot = {
  minStock: number
  stocks: { qty: number }[]
}

type CrewEventSnapshot = {
  startsAt: Date | string
  endsAt: Date | string | null
}

type EventSummary = {
  id: string
  title: string
  startsAt?: Date | string | null
  endsAt?: Date | string | null
}

type RfiSummary = {
  id: string
  subject: string
  assignedTo: string | null
  status: string
  dueDate?: Date | string | null
}

type ChangeOrderSummary = {
  id: string
  title: string
  project: string
  status: string
  submittedAt?: Date | string | null
}

type PurchaseOrderSummary = {
  id: string
  poNumber: string
  vendor: string
  status: string
  expectedOn?: Date | string | null
}

type CertificationSummary = {
  id: string
  employeeName: string
  certification: string
  status: string
  expiresOn?: Date | string | null
}

const USE_FIXTURES = process.env.PLAYWRIGHT_TEST === '1'

export const getDashboardMetrics = cache(async (): Promise<DashboardMetrics> => {
  // Return static data during schema migration - old schema models no longer exist
  return {
    jobsActive: 0,
    invoicesPending: 0,
    inventoryLowStock: 0,
    crewHoursThisWeek: 0,
    projectsBehindSchedule: 0,
    safetyAlertsOpen: 0,
  }
})

export const getActionQueueGroups = cache(async (): Promise<ActionQueueGroup[]> => {
  // Return empty array during schema migration - old schema models no longer exist
  return []
})
