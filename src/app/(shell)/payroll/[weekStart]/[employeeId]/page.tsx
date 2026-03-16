"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, DollarSign, CalendarDays, CheckCircle2 } from "lucide-react"
import { getEmployees } from "@/employees"
import { fetchWeekEvents, buildEmployeeDays, type DayEntry } from "../../_lib/events"

const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const SHORT_DAY   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function formatShortDate(d: Date): string {
  return `${SHORT_DAY[d.getDay()]}, ${SHORT_MONTH[d.getMonth()]} ${d.getDate()}`
}

function formatWeekLabel(monday: Date, sunday: Date): string {
  return `${SHORT_MONTH[monday.getMonth()]} ${monday.getDate()} – ${SHORT_MONTH[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
}

export default function PayrollEmployeePage() {
  const params     = useParams()
  const router     = useRouter()
  const weekStart  = typeof params.weekStart  === "string" ? params.weekStart  : ""
  const employeeId = typeof params.employeeId === "string" ? params.employeeId : ""

  const monday = useMemo(() => (weekStart ? parseYMD(weekStart) : new Date()), [weekStart])
  const sunday = useMemo(() => addDays(monday, 6), [monday])

  const [days, setDays]       = useState<DayEntry[]>([])
  const [loading, setLoading] = useState(true)

  const employees = useMemo(() => getEmployees(), [])
  const employee  = useMemo(() => employees.find(e => e.id === employeeId) ?? null, [employees, employeeId])
  const empName   = employee ? `${employee.firstName} ${employee.lastName}` : employeeId
  const initials  = empName.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()

  useEffect(() => {
    if (!weekStart || !employeeId) return
    let cancelled = false
    fetchWeekEvents(monday, sunday).then(events => {
      if (cancelled) return
      setDays(buildEmployeeDays(employeeId, events))
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [weekStart, employeeId, monday, sunday])

  const totalPay    = useMemo(() => days.reduce((s, d) => s + d.pay, 0), [days])
  const payrollDays = useMemo(() => days.filter(d => d.payroll).length, [days])
  const weekLabel   = formatWeekLabel(monday, sunday)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 md:px-8">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(23,23,23,0.5)] p-6 shadow-[0_20px_60px_rgba(3,6,23,0.45)] backdrop-blur-xl">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl" />

        {/* Back button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => router.push(`/payroll/${weekStart}`)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Back to week"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Identity */}
        <div className="relative mt-5 flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-base font-bold text-emerald-300 ring-1 ring-emerald-500/30">
            {initials}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
              Employee
            </p>
            <h1 className="mt-0.5 text-3xl font-bold text-white">{empName}</h1>
            <p className="mt-0.5 text-xs text-white/40">Week of {weekLabel}</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <CalendarDays className="h-3.5 w-3.5" />
              Days Worked
            </div>
            <p className="mt-1.5 text-2xl font-bold text-white">
              {loading ? <span className="text-white/20">—</span> : days.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Payroll Days
            </div>
            <p className="mt-1.5 text-2xl font-bold text-white">
              {loading ? <span className="text-white/20">—</span> : payrollDays}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <DollarSign className="h-3.5 w-3.5" />
              Total Pay
            </div>
            <p className="mt-1.5 text-xl font-bold text-emerald-300">
              {loading ? <span className="text-white/20">—</span> : formatCurrency(totalPay)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Day breakdown ────────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center gap-3 px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Daily Breakdown
          </p>
          <div className="flex-1 border-t border-white/10" />
          {!loading && days.length > 0 && (
            <span className="text-xs text-white/25">{days.length} day{days.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(23,23,23,0.3)] shadow-[0_8px_32px_rgba(3,6,23,0.3)] backdrop-blur-sm">
          {loading ? (
            <div className="flex items-center gap-3 px-5 py-6">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-sm text-white/40">Loading breakdown…</span>
            </div>
          ) : days.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                <DollarSign className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm text-white/40">No activity recorded for this employee this week.</p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-[130px,1fr,80px,100px] gap-3 border-b border-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
                <span>Date</span>
                <span>Project</span>
                <span className="text-center">Payroll</span>
                <span className="text-right">Pay</span>
              </div>

              {days.map((day, idx) => (
                <div
                  key={day.ymd}
                  className={[
                    "grid grid-cols-[130px,1fr,80px,100px] items-center gap-3 px-5 py-3.5",
                    idx < days.length - 1 ? "border-b border-white/10" : "",
                  ].join(" ")}
                >
                  <span className="text-sm text-white/60">{formatShortDate(day.date)}</span>

                  <span className="truncate text-sm font-medium text-white" title={day.eventTitle}>
                    {day.eventTitle}
                  </span>

                  <span className="flex justify-center">
                    {day.payroll ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/20">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white/25">
                        No
                      </span>
                    )}
                  </span>

                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-300">{formatCurrency(day.pay)}</span>
                    {day.isEstimated && (
                      <span className="ml-1 text-[10px] text-white/25" title="Estimated from hourly rate">est.</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div className="grid grid-cols-[130px,1fr,80px,100px] items-center gap-3 border-t border-white/10 bg-emerald-500/5 px-5 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  Grand Total
                </span>
                <span />
                <span />
                <span className="text-right text-base font-bold text-white">{formatCurrency(totalPay)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
