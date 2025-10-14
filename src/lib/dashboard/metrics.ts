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
  if (USE_FIXTURES) {
    return {
      jobsActive: 11,
      invoicesPending: 107,
      inventoryLowStock: 0,
      crewHoursThisWeek: 672,
      projectsBehindSchedule: 3,
      safetyAlertsOpen: 2,
    }
  }

  const prisma = await getPrisma()
  const now = new Date()
  const weekStart = startOfWeek(now)
  const weekEnd = endOfWeek(now)

  const [jobsActive, invoicesPending, inventoryRaw, crewRaw] = await Promise.all([
    prisma.event.count({
      where: {
        startsAt: { lte: weekEnd },
        endsAt: { gte: weekStart },
      },
    }),
    prisma.event.count({ where: { OR: [{ invoiceNumber: null }, { invoiceNumber: '' }] } }),
    prisma.inventoryItem.findMany({
      where: { deletedAt: null, minStock: { gt: 0 } },
      select: { minStock: true, stocks: { select: { qty: true } } },
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: weekStart, lt: weekEnd } },
      select: { startsAt: true, endsAt: true },
    }),
  ])

  const inventoryItems = inventoryRaw as InventorySnapshot[]
  const crewEvents = crewRaw as CrewEventSnapshot[]

  const inventoryLowStock = inventoryItems.reduce<number>((count, item) => {
    const onHand = item.stocks.reduce((sum: number, stock) => sum + stock.qty, 0)
    return onHand < item.minStock ? count + 1 : count
  }, 0)

  const crewMinutes = crewEvents.reduce((total: number, event) => {
    const start = event.startsAt ? new Date(event.startsAt) : null
    const end = event.endsAt ? new Date(event.endsAt) : null
    if (!start) return total
    const finish = end && end > start ? end : start
    const minutes = (finish.getTime() - start.getTime()) / 60000
    return total + Math.max(minutes, 0)
  }, 0)

  return {
    jobsActive,
    invoicesPending,
    inventoryLowStock,
    crewHoursThisWeek: Number((crewMinutes / 60).toFixed(1)),
    projectsBehindSchedule: 0,
    safetyAlertsOpen: 0,
  }
})

export const getActionQueueGroups = cache(async (): Promise<ActionQueueGroup[]> => {
  if (USE_FIXTURES) {
    return [
      {
        key: 'payapps',
        label: 'Pay Apps',
        items: [
          {
            id: 'payapp-1',
            title: 'Central Civil: NDWWTP (Timed)',
            description: 'Pending closeout approval',
            due: new Date('2024-09-05T12:00:00Z').toISOString(),
            href: '/finance/pay-apps',
          },
          {
            id: 'payapp-2',
            title: 'Downrite',
            description: 'Pending closeout approval',
            due: new Date('2024-08-23T12:00:00Z').toISOString(),
            href: '/finance/pay-apps',
          },
          {
            id: 'payapp-3',
            title: 'West Corridor Lighting',
            description: 'PM review required before submission',
            due: new Date('2024-10-18T12:00:00Z').toISOString(),
            href: '/finance/pay-apps',
          },
        ],
      },
      {
        key: 'logistics',
        label: 'Logistics',
        items: [
          {
            id: 'log-1',
            title: 'Material drop – US-27 mile 18',
            description: 'Reschedule for Friday due to lane closure',
            due: new Date('2024-10-16T12:00:00Z').toISOString(),
            href: '/inventory/transfers',
          },
          {
            id: 'log-2',
            title: 'Crew 4 staging delay',
            description: 'Need alternate yard access badge',
            due: new Date('2024-10-15T12:00:00Z').toISOString(),
            href: '/employees',
          },
        ],
      },
      {
        key: 'safety',
        label: 'Safety',
        items: [
          {
            id: 'safety-1',
            title: 'Guardrail panel near miss follow-up',
            description: 'Confirm corrective actions with crew',
            due: new Date('2024-10-14T12:00:00Z').toISOString(),
            href: '/compliance/incidents',
          },
          {
            id: 'safety-2',
            title: 'PPE audit – Segment 4',
            description: 'Baseline inventory before night shift',
            due: new Date('2024-10-17T12:00:00Z').toISOString(),
            href: '/inventory/items',
          },
        ],
      },
    ]
  }

  const prisma = await getPrisma()

  const [approvalsRaw, rfisRaw, changeOrdersRaw, purchaseOrdersRaw, certificationsRaw] = await Promise.all([
    prisma.event
      .findMany({
        where: { invoiceNumber: null },
        select: { id: true, title: true, endsAt: true },
        take: 5,
      })
      .catch(() => []),
    prisma.rfi
      .findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      .catch(() => []),
    prisma.changeOrder
      .findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
      })
      .catch(() => []),
    prisma.purchaseOrder
      .findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
      })
      .catch(() => []),
    prisma.certification
      .findMany({
        orderBy: { expiresOn: 'asc' },
        where: { expiresOn: { not: null } },
        take: 5,
      })
      .catch(() => []),
  ])

  const approvals = approvalsRaw as EventSummary[]
  const rfis = rfisRaw as RfiSummary[]
  const changeOrders = changeOrdersRaw as ChangeOrderSummary[]
  const purchaseOrders = purchaseOrdersRaw as PurchaseOrderSummary[]
  const certifications = certificationsRaw as CertificationSummary[]

  return [
    {
      key: 'approvals',
      label: 'Approvals',
      items: approvals.map(item => ({
        id: item.id,
        title: item.title,
        description: 'Pending closeout approval',
        due: item.endsAt ? new Date(item.endsAt).toISOString() : null,
        href: '/finance/pay-apps',
      })),
    },
    {
      key: 'rfis',
      label: 'RFIs',
      items: rfis.map(item => ({
        id: item.id,
        title: item.subject,
        description: item.assignedTo ? `Assigned to ${item.assignedTo}` : 'Information requested',
        due: item.dueDate ? new Date(item.dueDate).toISOString() : null,
        href: '/projects',
      })),
    },
    {
      key: 'cos',
      label: 'COs',
      items: changeOrders.map(item => ({
        id: item.id,
        title: item.title,
        description: `${item.project} · ${item.status}`,
        due: item.submittedAt ? new Date(item.submittedAt).toISOString() : null,
        href: '/finance/change-orders',
      })),
    },
    {
      key: 'pos',
      label: 'POs',
      items: purchaseOrders.map(item => ({
        id: item.id,
        title: item.poNumber || `PO ${item.id.slice(0, 6)}`,
        description: `${item.vendor} · ${item.status}`,
        due: item.expectedOn ? new Date(item.expectedOn).toISOString() : null,
        href: '/procurement/po',
      })),
    },
    {
      key: 'certs',
      label: 'Expiring Certs',
      items: certifications.map(item => ({
        id: item.id,
        title: `${item.certification} – ${item.employeeName}`,
        description: item.status,
        due: item.expiresOn ? new Date(item.expiresOn).toISOString() : null,
        href: '/hr/certs',
      })),
    },
  ]
})
