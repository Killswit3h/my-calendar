"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, DollarSign, Printer } from "lucide-react"
import { getEmployees } from "@/employees"
import { fetchWeekEvents, buildEmployeeDays, type DayEntry } from "../../_lib/events"

const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const FULL_DAY    = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
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

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function formatWeekLabel(monday: Date, sunday: Date): string {
  return `${SHORT_MONTH[monday.getMonth()]} ${monday.getDate()} – ${SHORT_MONTH[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
}

function formatSlashDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`
}

type DaySlot = {
  date: Date
  ymd: string
  payrollEntry: DayEntry | null
  noPayrollEntry: DayEntry | null
  dayPay: number
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

  // Build a slot for each of the 7 days (Mon–Sun)
  const slots = useMemo<DaySlot[]>(() => {
    const byYmd = new Map<string, DayEntry[]>()
    for (const d of days) {
      if (!byYmd.has(d.ymd)) byYmd.set(d.ymd, [])
      byYmd.get(d.ymd)!.push(d)
    }
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i)
      const ymd  = toYMD(date)
      const entries = byYmd.get(ymd) ?? []
      const payrollEntry   = entries.find(e => e.payroll) ?? null
      const noPayrollEntry = entries.find(e => !e.payroll) ?? null
      const dayPay = entries.reduce((s, e) => s + e.pay, 0)
      return { date, ymd, payrollEntry, noPayrollEntry, dayPay }
    })
  }, [days, monday])

  const totalPay    = useMemo(() => days.reduce((s, d) => s + d.pay, 0), [days])
  const daysWorked  = useMemo(() => new Set(days.map(d => d.ymd)).size, [days])
  const payrollDays = useMemo(() => slots.filter(s => s.payrollEntry !== null).length, [slots])
  const weekLabel   = formatWeekLabel(monday, sunday)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8">

      {/* ── Compact header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(23,23,23,0.5)] p-5 shadow-[0_20px_60px_rgba(3,6,23,0.45)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl" />

        <div className="relative flex items-center justify-between">
          {/* Back + identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/payroll/${weekStart}`)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Back to week"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              {initials}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Employee</p>
              <h1 className="text-lg font-bold leading-tight text-white">{empName}</h1>
            </div>
          </div>

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <Printer className="h-4 w-4" />
            Report
          </button>
        </div>

        {/* Inline stat strip */}
        <div className="relative mt-4 flex flex-wrap items-center gap-x-6 gap-y-1.5 border-t border-white/10 pt-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/40">Week of</span>
            <span className="text-xs font-semibold text-white">{weekLabel}</span>
          </div>
          <div className="h-3 w-px bg-white/15" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/40">Days Worked</span>
            <span className="text-xs font-bold text-white">
              {loading ? "—" : daysWorked}
            </span>
          </div>
          <div className="h-3 w-px bg-white/15" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/40">Payroll Days</span>
            <span className="text-xs font-bold text-white">
              {loading ? "—" : payrollDays}
            </span>
          </div>
          <div className="h-3 w-px bg-white/15" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/40">Total Pay</span>
            <span className="text-xs font-bold text-emerald-300">
              {loading ? "—" : formatCurrency(totalPay)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Timesheet grid ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(23,23,23,0.3)] shadow-[0_8px_32px_rgba(3,6,23,0.3)] backdrop-blur-sm">

        {/* Section group headers */}
        <div className="grid grid-cols-[120px_1fr_1fr_110px] border-b border-white/10">
          <div className="border-r border-white/10 px-4 py-2" />
          <div className="border-r border-white/10 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">Payroll</span>
          </div>
          <div className="border-r border-white/10 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">No Payroll</span>
          </div>
          <div className="px-4 py-2" />
        </div>

        {/* Column sub-headers */}
        <div className="grid grid-cols-[120px_1fr_1fr_110px] border-b border-white/10 bg-white/[0.02]">
          <div className="border-r border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/25">
            Date
          </div>
          <div className="border-r border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/25">
            Project
          </div>
          <div className="border-r border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/25">
            Project
          </div>
          <div className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-[0.2em] text-white/25">
            Payment
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 px-5 py-6">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-sm text-white/40">Loading timesheet…</span>
          </div>
        ) : (
          <>
            {slots.map((slot, idx) => {
              const isEmpty  = !slot.payrollEntry && !slot.noPayrollEntry
              const isWeekend = slot.date.getDay() === 0 || slot.date.getDay() === 6
              const isLast   = idx === slots.length - 1

              return (
                <div
                  key={slot.ymd}
                  className={[
                    "grid grid-cols-[120px_1fr_1fr_110px]",
                    !isLast ? "border-b border-white/10" : "",
                    isEmpty && isWeekend ? "opacity-30" : "",
                    isEmpty && !isWeekend ? "opacity-50" : "",
                  ].join(" ")}
                >
                  {/* Date cell */}
                  <div className="flex flex-col justify-center border-r border-white/10 px-4 py-3">
                    <span className={["text-sm font-semibold", isEmpty ? "text-white/40" : "text-white"].join(" ")}>
                      {FULL_DAY[slot.date.getDay()]}
                    </span>
                    <span className="text-xs text-white/35">{formatSlashDate(slot.date)}</span>
                  </div>

                  {/* Payroll column */}
                  <div className="flex items-center border-r border-white/10 px-4 py-3">
                    {slot.payrollEntry ? (
                      <span className="truncate text-sm font-medium text-white" title={slot.payrollEntry.eventTitle}>
                        {slot.payrollEntry.eventTitle}
                      </span>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                  </div>

                  {/* No-payroll column */}
                  <div className="flex items-center border-r border-white/10 px-4 py-3">
                    {slot.noPayrollEntry ? (
                      <span className="truncate text-sm text-white/70" title={slot.noPayrollEntry.eventTitle}>
                        {slot.noPayrollEntry.eventTitle}
                      </span>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                  </div>

                  {/* Payment cell */}
                  <div className="flex items-center justify-end px-4 py-3">
                    {!isEmpty ? (
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-300">
                          {formatCurrency(slot.dayPay)}
                        </span>
                        {(slot.payrollEntry?.isEstimated || slot.noPayrollEntry?.isEstimated) && (
                          <span className="ml-1 text-[10px] text-white/25" title="Estimated from hourly rate">est.</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}

            {/* Totals footer */}
            <div className="grid grid-cols-[120px_1fr_1fr_110px] border-t border-white/10 bg-emerald-500/5">
              <div className="border-r border-white/10 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  {daysWorked} day{daysWorked !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="border-r border-white/10 px-4 py-3">
                <span className="text-xs text-white/25">
                  {slots.filter(s => s.payrollEntry).length} payroll job{slots.filter(s => s.payrollEntry).length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center justify-end border-r border-white/10 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Grand Total</span>
              </div>
              <div className="flex items-center justify-end px-4 py-3">
                <span className="text-base font-bold text-white">{formatCurrency(totalPay)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notes row — mirrors paper form */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(23,23,23,0.3)] backdrop-blur-sm">
        <div className="grid grid-cols-[1fr_200px]">
          <div className="border-r border-white/10 px-5 py-3.5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/25">Notes</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/10">
            <div className="px-4 py-3">
              <p className="text-xs text-white/25">Rate</p>
              <p className="mt-0.5 text-sm font-semibold text-white/50">
                {loading ? "—" : formatCurrency(days.length > 0 && daysWorked > 0 ? totalPay / daysWorked : 0)}
                <span className="ml-1 text-[10px] font-normal text-white/25">/day</span>
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-white/25">Total</p>
              <p className="mt-0.5 text-sm font-bold text-emerald-300">
                {loading ? "—" : formatCurrency(totalPay)}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
