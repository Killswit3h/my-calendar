import { beforeEach, describe, expect, it } from 'vitest'
import { Prisma } from '@prisma/client'

const day = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`)

class PrismaStub {
  events: any[]
  assignments: any[]
  calendars: any[]
  employees: any[]
  rates: any[]
  deletedWhere: any = null
  createdRows: any[] = []

  constructor({
    events,
    assignments,
    calendars,
    employees,
    rates,
  }: {
    events: any[]
    assignments: any[]
    calendars: any[]
    employees: any[]
    rates: any[]
  }) {
    this.events = events
    this.assignments = assignments
    this.calendars = calendars
    this.employees = employees
    this.rates = rates
  }

  event = {
    findMany: async () => this.events,
  }

  eventAssignment = {
    findMany: async () => this.assignments,
  }

  calendar = {
    findMany: async () => this.calendars,
  }

  employee = {
    findMany: async () => this.employees,
  }

  hourlyRate = {
    findMany: async () => this.rates,
  }

  laborDaily = {
    deleteMany: async ({ where }: any) => {
      this.deletedWhere = where
      return { count: 0 }
    },
    createMany: async ({ data }: any) => {
      this.createdRows = data
      return { count: data.length }
    },
  }

  $transaction = async (operations: Promise<unknown>[]) => Promise.all(operations)
}

describe('buildLaborDaily', () => {
  beforeEach(() => {
    process.env.LABOR_DEFAULT_DAY_HOURS = '8'
    process.env.LABOR_OVERTIME_THRESHOLD = '8'
    process.env.LABOR_OT_MULTIPLIER = '1.5'
  })

  it('explodes events into per-day labor rows with rates and overtime', async () => {
    const { buildLaborDaily } = await import('@/lib/finance/buildLaborDaily')

    const prisma = new PrismaStub({
      events: [
        {
          id: 'evt-1',
          calendarId: 'JOB-001',
          title: 'I-95 Night Shift',
          startsAt: new Date('2024-10-15T12:00:00Z'),
          endsAt: new Date('2024-10-17T20:00:00Z'),
        },
      ],
      assignments: [
        { id: 'evt-1-e1', eventId: 'evt-1', employeeId: 'e1', dayOverride: null, hours: null, note: null },
        { id: 'evt-1-e2', eventId: 'evt-1', employeeId: 'e2', dayOverride: null, hours: null, note: null },
        {
          id: 'evt-1-e1-2024-10-16',
          eventId: 'evt-1',
          employeeId: 'e1',
          dayOverride: day('2024-10-16'),
          hours: new Prisma.Decimal(10),
          note: 'Overtime assist',
        },
        {
          id: 'evt-1-e3-2024-10-16',
          eventId: 'evt-1',
          employeeId: 'e3',
          dayOverride: day('2024-10-16'),
          hours: new Prisma.Decimal(8),
          note: null,
        },
      ],
      calendars: [{ id: 'JOB-001', name: 'I-95 Barrier' }],
      employees: [
        { id: 'e1', name: 'Worker One', hourlyRate: new Prisma.Decimal(25) },
        { id: 'e2', name: 'Worker Two', hourlyRate: new Prisma.Decimal(28) },
        { id: 'e3', name: 'Worker Three', hourlyRate: null },
      ],
      rates: [
        { employeeId: 'e1', effectiveDate: day('2024-09-01'), rate: new Prisma.Decimal(24) },
        { employeeId: 'e1', effectiveDate: day('2024-10-16'), rate: new Prisma.Decimal(26) },
      ],
    })

    const result = await buildLaborDaily({
      startDate: '2024-10-15',
      endDate: '2024-10-17',
      prisma: prisma as any,
    })

    expect(result.rowsInserted).toBe(6)
    expect(result.missingRates).toEqual([{ employeeId: 'e3', day: '2024-10-16' }])
    expect(prisma.deletedWhere.day.gte).toEqual(new Date('2024-10-15T04:00:00.000Z'))

    const rows = prisma.createdRows.map(row => ({
      day: row.day.toISOString().slice(0, 10),
      employeeId: row.employeeId,
      hours: Number(row.hoursDecimal),
      regularHours: Number(row.regularHours),
      overtimeHours: Number(row.overtimeHours),
      rate: Number(row.rateUsd),
      totalCost: Number(row.totalCostUsd),
      note: row.note,
    }))

    const dayEmployee = (day: string, employeeId: string) =>
      rows.find(row => row.day === day && row.employeeId === employeeId)

    expect(dayEmployee('2024-10-15', 'e1')).toMatchObject({ hours: 8, rate: 24, totalCost: 192 })
    expect(dayEmployee('2024-10-15', 'e2')).toMatchObject({ hours: 8, rate: 28, totalCost: 224 })

    const overtimeRow = dayEmployee('2024-10-16', 'e1')
    expect(overtimeRow).toBeDefined()
    expect(overtimeRow?.hours).toBeCloseTo(10)
    expect(overtimeRow?.regularHours).toBeCloseTo(8)
    expect(overtimeRow?.overtimeHours).toBeCloseTo(2)
    expect(overtimeRow?.rate).toBeCloseTo(26)
    expect(overtimeRow?.totalCost).toBeCloseTo(286)
    expect(overtimeRow?.note).toBe('Overtime assist')

    expect(dayEmployee('2024-10-16', 'e2')).toMatchObject({ hours: 8, rate: 28, totalCost: 224 })
    expect(dayEmployee('2024-10-17', 'e1')).toMatchObject({ hours: 8, rate: 26, totalCost: 208 })
  })
})
