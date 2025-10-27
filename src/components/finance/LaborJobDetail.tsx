'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Card from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type DayRow = {
  day: string
  hours: number
  cost: number
  employees: {
    employeeId: string
    employeeName: string
    hours: number
    regularHours: number
    overtimeHours: number
    rate: number
    regularCost: number
    overtimeCost: number
    totalCost: number
    eventId: string
    eventTitle: string | null
    note: string | null
  }[]
}

type JobDetailResponse = {
  range: { start: string; end: string }
  job: { id: string; name: string | null }
  totals: {
    days: number
    employees: number
    hours: number
    cost: number
    averageRate: number
  }
  days: DayRow[]
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return (await res.json()) as JobDetailResponse
}

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const formatHours = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function LaborJobDetail({
  jobId,
  initialStart,
  initialEnd,
}: {
  jobId: string
  initialStart: string
  initialEnd: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)

  const hasInvalidRange = start > end
  const { data, error, isLoading, mutate } = useSWR(
    hasInvalidRange ? null : `/api/finance/labor/job/${encodeURIComponent(jobId)}?start=${start}&end=${end}`,
    fetcher,
  )

  const handleExport = () => {
    if (!data) return
    const header = [
      'Day',
      'Employee',
      'Hours',
      'Regular Hours',
      'Overtime Hours',
      'Rate',
      'Regular Cost',
      'Overtime Cost',
      'Total Cost',
      'Event',
      'Note',
    ]
    const rows: string[][] = [header]
    data.days.forEach(day => {
      day.employees.forEach(emp => {
        rows.push([
          day.day,
          emp.employeeName,
          emp.hours.toString(),
          emp.regularHours.toString(),
          emp.overtimeHours.toString(),
          emp.rate.toString(),
          emp.regularCost.toString(),
          emp.overtimeCost.toString(),
          emp.totalCost.toString(),
          emp.eventTitle ? `${emp.eventTitle} (${emp.eventId})` : emp.eventId,
          emp.note ?? '',
        ])
      })
    })
    const blob = new Blob(rows.map(row => `${row.map(escapeCsvCell).join(',')}\n`), {
      type: 'text/csv;charset=utf-8;',
    })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = `${jobId}-${start}-${end}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {data?.job.name ?? params.get('jobName') ?? jobId}
          </h1>
          <p className="text-sm text-white/60">
            Daily detail with crew breakdown. Adjust the range to regenerate numbers.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" disabled={isLoading || hasInvalidRange} onClick={() => mutate()}>
            Refresh
          </Button>
        </div>
      </header>

      <Card tone="surface" bordered>
        <div className="grid gap-4 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
          <Input type="date" value={start} onChange={event => setStart(event.target.value)} aria-label="Start date" />
          <Input type="date" value={end} onChange={event => setEnd(event.target.value)} aria-label="End date" />
        </div>
        {hasInvalidRange ? (
          <Badge className="bg-status-warning/20 text-status-warning">Start must be before end</Badge>
        ) : null}
      </Card>

      {error ? (
        <Card tone="muted" className="border border-status-danger/40 text-status-danger">
          <div className="flex flex-col gap-2">
            <div className="font-semibold">Unable to load job detail</div>
            <div className="text-sm opacity-80">{error.message}</div>
          </div>
        </Card>
      ) : null}

      {data ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total cost" value={formatCurrency(data.totals.cost)} />
          <Metric label="Total hours" value={formatHours(data.totals.hours)} />
          <Metric label="Employees" value={data.totals.employees.toString()} />
          <Metric label="Avg rate" value={formatCurrency(data.totals.averageRate)} />
        </section>
      ) : null}

      <Card tone="surface" bordered className="gap-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead>Day</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Regular</TableHead>
              <TableHead>Overtime</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted">
                  Loading detail…
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && data && data.days.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted">
                  No labor rows for this job in the selected range.
                </TableCell>
              </TableRow>
            ) : null}
            {data?.days.map(day => (
              <DayRow key={day.day} day={day} />
            ))}
          </TableBody>
        </Table>
      </Card>

      {data ? (
        <div className="text-xs text-muted">
          {data.range.start} → {data.range.end}
        </div>
      ) : null}
    </div>
  )
}

function DayRow({ day }: { day: DayRow }) {
  return (
    <>
      <TableRow className="border-border/20 bg-foreground/5">
        <TableCell className="font-semibold text-white">{day.day}</TableCell>
        <TableCell colSpan={7}>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>{formatHours(day.hours)} hours</span>
            <span>•</span>
            <span>{formatCurrency(day.cost)}</span>
          </div>
        </TableCell>
      </TableRow>
      {day.employees.map(employee => (
        <TableRow key={`${day.day}-${employee.employeeId}`} className="border-border/10">
          <TableCell />
          <TableCell className="text-white/90">{employee.employeeName}</TableCell>
          <TableCell>{formatHours(employee.hours)}</TableCell>
          <TableCell>{formatHours(employee.regularHours)}</TableCell>
          <TableCell>{formatHours(employee.overtimeHours)}</TableCell>
          <TableCell>{formatCurrency(employee.rate)}</TableCell>
          <TableCell>{formatCurrency(employee.totalCost)}</TableCell>
          <TableCell className="text-muted">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.2em] text-muted/70">{employee.eventId}</span>
              {employee.eventTitle ? <span>{employee.eventTitle}</span> : null}
              {employee.note ? <span className="text-xs text-muted/70">Note: {employee.note}</span> : null}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function escapeCsvCell(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card tone="surface" bordered className="bg-surface/60">
      <div className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </Card>
  )
}

export default LaborJobDetail
