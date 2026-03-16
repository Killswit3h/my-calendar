"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Printer, DollarSign, Users, ChevronRight, CalendarDays } from "lucide-react"
import { getEmployees } from "@/employees"
import { payById } from "@/data/employeeRoster"
import { fetchWeekEvents, type CalendarEvent } from "../_lib/events"

const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function formatDate(d: Date): string {
  return `${SHORT_MONTH[d.getMonth()]} ${d.getDate()}`
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
}

type EmployeeRow = {
  id: string
  name: string
  daysWorked: number
  totalPay: number
  isEstimated: boolean
}

export default function PayrollWeekPage() {
  const params    = useParams()
  const router    = useRouter()
  const weekStart = typeof params.weekStart === "string" ? params.weekStart : ""

  const monday = useMemo(() => (weekStart ? parseYMD(weekStart) : new Date()), [weekStart])
  const sunday = useMemo(() => addDays(monday, 6), [monday])

  const [events, setEvents]   = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const employees = useMemo(() => getEmployees(), [])

  useEffect(() => {
    if (!weekStart) return
    let cancelled = false
    fetchWeekEvents(monday, sunday).then(items => {
      if (!cancelled) { setEvents(items); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [weekStart, monday, sunday])

  const rows = useMemo<EmployeeRow[]>(() => {
    const nameById          = new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]))
    const empDays           = new Map<string, Set<string>>()
    const empPay            = new Map<string, number>()
    const empHasExplicitPay = new Set<string>()

    for (const ev of events) {
      const empIds: string[] = ev.checklist?.employees ?? []
      if (!empIds.length) continue
      const startDate = ev.startsAt.slice(0, 10)
      for (const empId of empIds) {
        if (!empDays.has(empId)) empDays.set(empId, new Set())
        empDays.get(empId)!.add(startDate)
        const payVal = ev.checklist?.employeePay?.[empId]
        if (payVal !== undefined && payVal !== "") {
          const parsed = parseFloat(payVal)
          if (!isNaN(parsed)) {
            empPay.set(empId, (empPay.get(empId) ?? 0) + parsed)
            empHasExplicitPay.add(empId)
          }
        }
      }
    }

    const result: EmployeeRow[] = []
    for (const [empId, daySet] of empDays) {
      const daysWorked = daySet.size
      let totalPay: number
      let isEstimated: boolean
      if (empHasExplicitPay.has(empId)) {
        totalPay = empPay.get(empId) ?? 0
        isEstimated = false
      } else {
        totalPay = (payById[empId] ?? 0) * 8 * daysWorked
        isEstimated = true
      }
      result.push({ id: empId, name: nameById.get(empId) ?? empId, daysWorked, totalPay, isEstimated })
    }
    result.sort((a, b) => a.name.localeCompare(b.name))
    return result
  }, [events, employees])

  const grandTotal = useMemo(() => rows.reduce((s, r) => s + r.totalPay, 0), [rows])
  const weekLabel  = `${formatDate(monday)} – ${formatDate(sunday)}, ${sunday.getFullYear()}`

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 md:px-8">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(23,23,23,0.5)] p-6 shadow-[0_20px_60px_rgba(3,6,23,0.45)] backdrop-blur-xl">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl" />

        {/* Nav + actions */}
        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/payroll")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Back to Payroll"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <Printer className="h-4 w-4" />
            Report
          </button>
        </div>

        {/* Title */}
        <div className="relative mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
            Week of
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">{weekLabel}</h1>
        </div>

        {/* Summary stat cards */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Users className="h-3.5 w-3.5" />
              Employees
            </div>
            <p className="mt-1.5 text-2xl font-bold text-white">
              {loading ? <span className="text-white/20">—</span> : rows.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <CalendarDays className="h-3.5 w-3.5" />
              Avg. Days
            </div>
            <p className="mt-1.5 text-2xl font-bold text-white">
              {loading || rows.length === 0
                ? <span className="text-white/20">—</span>
                : (rows.reduce((s, r) => s + r.daysWorked, 0) / rows.length).toFixed(1)
              }
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <DollarSign className="h-3.5 w-3.5" />
              Total
            </div>
            <p className="mt-1.5 text-xl font-bold text-emerald-300">
              {loading ? <span className="text-white/20">—</span> : formatCurrency(grandTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Employee list ────────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center gap-3 px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Employees
          </p>
          <div className="flex-1 border-t border-white/10" />
          {!loading && rows.length > 0 && (
            <span className="text-xs text-white/25">{rows.length} total</span>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(23,23,23,0.3)] shadow-[0_8px_32px_rgba(3,6,23,0.3)] backdrop-blur-sm">
          {loading ? (
            <div className="flex items-center gap-3 px-5 py-6">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-sm text-white/40">Loading payroll data…</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                <DollarSign className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm text-white/40">No employee activity recorded for this week.</p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-[1fr,72px,130px,20px] gap-3 border-b border-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
                <span>Employee</span>
                <span className="text-center">Days</span>
                <span className="text-right">Total Pay</span>
                <span />
              </div>

              {rows.map((row, idx) => (
                <Link
                  key={row.id}
                  href={`/payroll/${weekStart}/${row.id}`}
                  className={[
                    "group grid grid-cols-[1fr,72px,130px,20px] items-center gap-3 px-5 py-3.5 transition hover:bg-white/5",
                    idx < rows.length - 1 ? "border-b border-white/10" : "",
                  ].join(" ")}
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/20">
                      {row.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
                    </div>
                    <span className="text-sm font-medium text-white">{row.name}</span>
                  </div>

                  {/* Days worked — pill */}
                  <div className="flex justify-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-white/70">
                      {row.daysWorked}
                    </span>
                  </div>

                  {/* Pay */}
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-300">{formatCurrency(row.totalPay)}</span>
                    {row.isEstimated && (
                      <span className="ml-1 text-[10px] text-white/25" title="Estimated from hourly rate">est.</span>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-white/20 transition group-hover:text-white/50" />
                </Link>
              ))}

              {/* Grand total */}
              <div className="grid grid-cols-[1fr,72px,130px,20px] items-center gap-3 border-t border-white/10 bg-emerald-500/5 px-5 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  Grand Total
                </span>
                <span />
                <span className="text-right text-base font-bold text-white">{formatCurrency(grandTotal)}</span>
                <span />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
