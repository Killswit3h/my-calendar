'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Card from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLaborFinance } from '@/app/(dashboard)/finance/hooks/useLaborFinance'
import type { FinanceLaborProject } from '@/lib/finance/labor'

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const formatHours = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const projectDaysActive = (project: FinanceLaborProject) => {
  const first = new Date(project.firstEvent)
  const last = new Date(project.lastEvent)
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return 0
  const diff = last.getTime() - first.getTime()
  if (diff < 0) return 0
  return Math.max(1, Math.floor(diff / 86_400_000) + 1)
}

export function LaborDashboard({ initialStart, initialEnd }: { initialStart: string; initialEnd: string }) {
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [crewFilter, setCrewFilter] = useState<string>('all')

  const hasInvalidRange = start > end
  const { data, error, isLoading, mutate } = useLaborFinance(
    { from: start, to: end },
    { disabled: hasInvalidRange },
  )

  const projects = data?.projects ?? []

  const crewOptions = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach(project => {
      project.employees.forEach(emp => {
        if (!map.has(emp.employeeId)) map.set(emp.employeeId, emp.name || emp.employeeId)
      })
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesProject = projectFilter === 'all' || project.projectKey === projectFilter
      const matchesCrew =
        crewFilter === 'all' || project.employees.some(employee => employee.employeeId === crewFilter)
      return matchesProject && matchesCrew
    })
  }, [projects, projectFilter, crewFilter])

  const filteredTotals = useMemo(() => {
    const employeeSet = new Set<string>()
    let hours = 0
    let cost = 0

    filteredProjects.forEach(project => {
      project.employees.forEach(emp => employeeSet.add(emp.employeeId))
      hours += project.totalHours
      cost += project.totalCost
    })

    return {
      projects: filteredProjects.length,
      hours,
      cost,
      employees: employeeSet.size,
      averageRate: hours > 0 ? cost / hours : 0,
    }
  }, [filteredProjects])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-white">Labor Cost Dashboard</h1>
        <p className="text-sm text-white/60">
          Track labor spend per project with employee-level detail. Filters update in real time.
        </p>
      </header>

      <Card tone="surface" bordered>
        <div className="grid gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))]">
          <Input
            type="date"
            value={start}
            onChange={event => setStart(event.target.value)}
            aria-label="Start date"
            className="bg-foreground/5"
          />
          <Input
            type="date"
            value={end}
            onChange={event => setEnd(event.target.value)}
            aria-label="End date"
            className="bg-foreground/5"
          />
          <Select label="Project" value={projectFilter} onChange={event => setProjectFilter(event.target.value)}>
            <option value="all">All projects</option>
            {projects.map(project => (
              <option key={project.projectKey} value={project.projectKey}>
                {project.projectName}
              </option>
            ))}
          </Select>
          <Select label="Crew" value={crewFilter} onChange={event => setCrewFilter(event.target.value)}>
            <option value="all">All crew</option>
            {crewOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={isLoading || hasInvalidRange} onClick={() => mutate()}>
            Refresh
          </Button>
          {hasInvalidRange ? (
            <Badge className="bg-status-warning/20 text-status-warning">Start must be before end</Badge>
          ) : null}
        </div>
      </Card>

      {error ? (
        <Card tone="muted" className="border border-status-danger/40 text-status-danger">
          <div className="flex flex-col gap-2">
            <div className="font-semibold">Unable to load labor data</div>
            <div className="text-sm opacity-80">{error.message}</div>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total cost" value={formatCurrency(filteredTotals.cost)} />
        <MetricCard label="Total hours" value={formatHours(filteredTotals.hours)} />
        <MetricCard label="Projects active" value={filteredTotals.projects.toString()} />
        <MetricCard label="Employees active" value={filteredTotals.employees.toString()} />
      </section>

      <Card tone="surface" bordered className="gap-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead>Project</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Crew</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Avg $/hr</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted">
                  Loading summary…
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted">
                  No projects match the current filters.
                </TableCell>
              </TableRow>
            ) : null}
            {filteredProjects.map(project => {
              const days = projectDaysActive(project)
              const crewCount = project.employees.length
              const averageRate = project.totalHours > 0 ? project.totalCost / project.totalHours : 0
              const detailHref = project.projectId
                ? `/finance/job/${encodeURIComponent(project.projectId)}?start=${start}&end=${end}&jobName=${encodeURIComponent(
                    project.projectName,
                  )}`
                : null
              return (
                <TableRow key={project.projectKey} className="border-border/20 hover:bg-foreground/5">
                  <TableCell className="space-y-1 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <span>{project.projectName}</span>
                      {project.warnings.length ? (
                        <Badge className="bg-status-warning/15 text-status-warning">
                          {project.warnings.length} warning{project.warnings.length === 1 ? '' : 's'}
                        </Badge>
                      ) : null}
                    </div>
                    {project.customerName ? (
                      <div className="text-xs text-muted">{project.customerName}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{days}</TableCell>
                  <TableCell>{crewCount}</TableCell>
                  <TableCell>{formatHours(project.totalHours)}</TableCell>
                  <TableCell>{formatCurrency(averageRate)}</TableCell>
                  <TableCell>{formatCurrency(project.totalCost)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild disabled={!detailHref}>
                      {detailHref ? <Link href={detailHref}>View detail</Link> : <span>Link unavailable</span>}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {data ? (
        <div className="text-xs text-muted">
          Range {data.range.from} → {data.range.to}. {data.summary.projects} projects,{' '}
          {data.summary.employees} employees, {data.summary.warnings} warnings.
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card tone="surface" bordered className="bg-surface/60">
      <div className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </Card>
  )
}

export default LaborDashboard
