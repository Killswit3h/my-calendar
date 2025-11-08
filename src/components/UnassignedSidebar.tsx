"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import type { Employee } from "@/employees";
import type { EventInput } from "@fullcalendar/core";
import { weekDates, ymdLocal, eventOverlapsLocalDay } from "@/lib/dateUtils";
import { getYardForDate, addYard, removeYard } from "@/lib/yard";
import { getAbsentForDate, addAbsent, removeAbsent } from "@/lib/absent";
import { EMPLOYEE_MIME, buildEmployeePayload } from "@/lib/dragAssign";
import { Button } from "@/components/ui/button";

type Props = {
  employees: Employee[];
  events: EventInput[];
  anyDateInView?: Date | null;
  selectedDate?: Date | null;
  weekStartsOn?: 0 | 1;
  onQuickAdd?: (employeeId: string, date: Date) => void;
  onSetYard?: (employeeId: string, date: Date) => void;
};

function formatDayLabel(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(d);
}

type RosterSection = "YARD_SHOP" | "NO_WORK";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

async function apiMoveToFree(input: { employeeId: string; dateISO: string; from: RosterSection }) {
  const res = await fetch(`/api/roster/move-to-free`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to move employee");
  }
  return res.json();
}

export default function UnassignedSidebar({ employees, events, anyDateInView = null, selectedDate = null, weekStartsOn = 1, onQuickAdd }: Props) {
  const handleAdd = (empId: string, date: Date) => {
    if (onQuickAdd) onQuickAdd(empId, date);
    else console.log("QuickAdd", empId, ymdLocal(date));
  };

  const daysToShow = useMemo(() => {
    if (selectedDate) return [selectedDate];
    return anyDateInView ? weekDates(anyDateInView, weekStartsOn) : [];
  }, [selectedDate, anyDateInView, weekStartsOn]);

  const [yardVersion, setYardVersion] = useState(0);
  const [isPending, startTransition] = useTransition();
  const bump = () => setYardVersion(v => v + 1);
  
  // Use SWR to revalidate roster data for the selected date
  const selectedDateKey = selectedDate ? `/api/roster?date=${encodeURIComponent(ymdLocal(selectedDate))}` : null;
  const { mutate: mutateRoster } = useSWR(selectedDateKey, fetcher, {
    revalidateOnFocus: false,
  });
  
  useEffect(() => {
    const handleYardChange = () => {
      bump();
    };
    
    window.addEventListener('yard-changed', handleYardChange);
    return () => window.removeEventListener('yard-changed', handleYardChange);
  }, []);

  // Map of dateKey -> Set of assigned employeeIds
  const { assignedByDay, eventAssignedByDay } = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const eventMap = new Map<string, Set<string>>();
    if (!daysToShow.length) return { assignedByDay: map, eventAssignedByDay: eventMap };
    const rangeStart = daysToShow[0];
    const rangeEnd = new Date(daysToShow[daysToShow.length - 1].getFullYear(), daysToShow[daysToShow.length - 1].getMonth(), daysToShow[daysToShow.length - 1].getDate() + 1);

    // Seed with Yard/Shop assignments first so they're treated as assigned
    for (const d of daysToShow) {
      const k = ymdLocal(d);
      const yardIds = getYardForDate(k);
      const absentIds = getAbsentForDate(k);
      if (yardIds.length) {
        let s = map.get(k);
        if (!s) { s = new Set<string>(); map.set(k, s); }
        yardIds.forEach((id) => s!.add(id));
      }
      if (absentIds.length) {
        let s = map.get(k);
        if (!s) { s = new Set<string>(); map.set(k, s); }
        absentIds.forEach((id) => s!.add(id));
      }
    }

    for (const ev of events ?? []) {
      const ex = (ev.extendedProps as any) ?? {};
      const checklist = ex.checklist ?? null;
      const employeeIds: string[] = Array.isArray(checklist?.employees) ? checklist.employees : [];
      if (!employeeIds.length) continue;

      const minimal = { start: ev.start as any, end: ev.end as any, allDay: !!ev.allDay };
      const weekSpanOverlaps = (() => {
        const pick = daysToShow.length >= 3 ? [daysToShow[0], daysToShow[Math.floor(daysToShow.length/2)], daysToShow[daysToShow.length-1]] : daysToShow;
        return pick.some(d => eventOverlapsLocalDay(minimal as any, d));
      })();
      if (!weekSpanOverlaps) {
        const evStart = minimal.start instanceof Date ? minimal.start : new Date(minimal.start);
        const evEnd = minimal.end instanceof Date ? minimal.end : new Date(minimal.end);
        if (evEnd <= rangeStart || evStart >= rangeEnd) continue;
      }

      for (const day of daysToShow) {
        if (eventOverlapsLocalDay(minimal as any, day)) {
          const k = ymdLocal(day);
          let s = map.get(k);
          if (!s) { s = new Set<string>(); map.set(k, s); }
          let eSet = eventMap.get(k);
          if (!eSet) { eSet = new Set<string>(); eventMap.set(k, eSet); }
          for (const id of employeeIds) {
            s.add(id);
            eSet.add(id);
          }
        }
      }
    }
    return { assignedByDay: map, eventAssignedByDay: eventMap };
  }, [events, daysToShow, yardVersion]);

  const isEmpty = employees.length === 0;

  // Force re-render by accessing yardVersion in render
  const _ = yardVersion; // eslint-disable-line @typescript-eslint/no-unused-vars

  async function handleRemove({ employeeId, fromSection, dateISO }: { employeeId: string; fromSection: RosterSection; dateISO: string }) {
    console.log("remove click", { employeeId, fromSection, dateISO });
    
    // Optimistic update: remove from localStorage immediately
    if (fromSection === "YARD_SHOP") {
      removeYard(dateISO, employeeId);
    } else if (fromSection === "NO_WORK") {
      removeAbsent(dateISO, employeeId);
    }
    
    // Trigger UI update
    bump();
    
    // Persist to database
    startTransition(async () => {
      try {
        await apiMoveToFree({ employeeId, dateISO, from: fromSection });
        console.log("Successfully moved employee to free");
        // Revalidate roster data for this date
        if (mutateRoster) await mutateRoster();
      } catch (err: any) {
        console.error("Failed to move employee:", err);
        // Revert optimistic update on failure
        if (fromSection === "YARD_SHOP") {
          addYard(dateISO, employeeId);
        } else if (fromSection === "NO_WORK") {
          addAbsent(dateISO, employeeId);
        }
        bump();
      }
    });
  }

  return (
    <div className="unassigned-sidebar" aria-label="Unassigned employees by day">
      <h3 className="sidebar-title">Unassigned Employees</h3>
      {!daysToShow.length ? (
        <div className="muted-sm">No week selected</div>
      ) : isEmpty ? (
        <div className="muted-sm">No employees</div>
      ) : (
        <div className="day-list" role="list">
          {daysToShow.map((d) => {
            const key = ymdLocal(d);
            const assigned = assignedByDay.get(key) ?? new Set<string>();
            const eventAssigned = eventAssignedByDay.get(key) ?? new Set<string>();
            const free = employees.filter((e) => !assigned.has(e.id) && e.status !== "TERMINATED");
            return (
              <div key={key} className="day-card" role="listitem" aria-label={`Unassigned for ${key}`}>
                <div className="day-header">
                  <div className="day-label">{formatDayLabel(d)}</div>
                  <div className="day-count" title="Free employees">{free.length ? `${free.length} free` : "All assigned"}</div>
                </div>
                <div className="section-card free-card">
                  <div className="section-title">Free Employees</div>
                  {free.length ? (
                    <div className="emp-list" role="list">
                      {free.map((e) => (
                        <div
                          key={e.id}
                          className="free-row"
                          role="listitem"
                          tabIndex={0}
                          aria-label={`Drag ${e.firstName} ${e.lastName} to assign`}
                          draggable
                          data-employee-id={e.id}
                          data-employee-name={`${e.firstName} ${e.lastName}`}
                          onDragStart={(ev) => {
                            const id = e.id;
                            const name = `${e.firstName} ${e.lastName}`;
                            ev.dataTransfer.setData('text/plain', id);
                            try { ev.dataTransfer.setData(EMPLOYEE_MIME, buildEmployeePayload(id, name)); } catch {}
                            (ev.currentTarget as HTMLElement).setAttribute('aria-grabbed', 'true');
                          }}
                          onDragEnd={(ev) => {
                            (ev.currentTarget as HTMLElement).setAttribute('aria-grabbed', 'false');
                          }}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              if (selectedDate) {
                                handleAdd(e.id, selectedDate);
                              }
                            }
                          }}
                        >
                          <div className="emp-name">{e.firstName} {e.lastName}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted-sm">All assigned</div>
                  )}
                </div>
                {/* Yard/Shop table (per-day, stored locally) */}
                {selectedDate ? (
                  <div className="section-card yard-card">
                    <div className="yard-title">Yard/Shop</div>
                    <div className="yard-list" role="list">
                      {(() => {
                        const yardIds = getYardForDate(key).filter(id => !eventAssigned.has(id));
                        if (!yardIds.length) return <div className="muted-xs">No one assigned</div>;
                        return yardIds.map((id) => {
                          const emp = employees.find(e => e.id === id);
                          const label = emp ? `${emp.firstName} ${emp.lastName}` : id;
                          return (
                            <div key={id} className="yard-row" role="listitem">
                              <div className="emp-name">{label}</div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemove({ employeeId: id, fromSection: "YARD_SHOP", dateISO: key });
                                }}
                                disabled={isPending}
                                aria-label={`Remove ${label} from Yard/Shop`}
                              >
                                Remove
                              </Button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="yard-row">
                      <select aria-label={`Add Yard/Shop employee for ${key}`} className="yard-select" defaultValue="">
                        <option value="" disabled>Select employee</option>
                        {free.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const sel = (e.currentTarget.previousSibling as HTMLSelectElement | null);
                          const val = sel?.value || '';
                          if (!val) return;
                          addYard(key, val);
                          sel!.value = '';
                          bump();
                          try { window.dispatchEvent(new CustomEvent('yard-changed')); } catch {}
                        }}
                      >Add</Button>
                    </div>
                  </div>
                ) : null}

                {/* No Work (Absent) table (per-day, stored locally) */}
                {selectedDate ? (
                  <div className="section-card yard-card">
                    <div className="yard-title">No Work</div>
                    <div className="yard-list" role="list">
                      {getAbsentForDate(key).length ? (
                        getAbsentForDate(key).map((id) => {
                          const emp = employees.find(e => e.id === id);
                          const label = emp ? `${emp.firstName} ${emp.lastName}` : id;
                          return (
                            <div key={id} className="yard-row" role="listitem">
                              <div className="emp-name">{label}</div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemove({ employeeId: id, fromSection: "NO_WORK", dateISO: key });
                                }}
                                disabled={isPending}
                                aria-label={`Remove ${label} from No Work`}
                              >
                                Remove
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="muted-xs">No one marked absent</div>
                      )}
                    </div>
                    <div className="yard-row">
                      <select aria-label={`Add No Work employee for ${key}`} className="yard-select" defaultValue="">
                        <option value="" disabled>Select employee</option>
                        {free.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const sel = (e.currentTarget.previousSibling as HTMLSelectElement | null);
                          const val = sel?.value || '';
                          if (!val) return;
                          addAbsent(key, val);
                          sel!.value = '';
                          bump();
                          try { window.dispatchEvent(new CustomEvent('yard-changed')); } catch {}
                        }}
                      >Add</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <style jsx>{`
        .unassigned-sidebar { display: grid; gap: 0.5rem; }
        .sidebar-title { font-size: 1rem; font-weight: 600; margin: 0 0 0.25rem; color: var(--text); }
        .day-list { display: grid; gap: 0.5rem; }
        .day-card { border: 1px solid var(--border); border-radius: 10px; background: var(--elev-2); padding: 0.5rem; }
        .day-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
        .day-label { font-weight: 600; color: var(--text); }
        .day-count { font-size: 0.75rem; background: #1e293b; color: #93c5fd; padding: 0.05rem 0.45rem; border-radius: 999px; border: 1px solid var(--border); }
        .emp-list { display: grid; gap: 0.25rem; max-height: 240px; overflow: auto; }
        .emp-row { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; align-items: center; }
        .free-row { display: block; }
        .emp-name { color: var(--text); font-size: 0.9rem; }
        .btn.tiny { font-size: 0.75rem; padding: 0.1rem 0.45rem; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); }
        .btn.tiny:hover { filter: brightness(1.1); }
        .section-card { background: var(--card-2); border: 1px solid var(--border); border-radius: 10px; padding: 0.5rem; }
        .free-card { margin-bottom: 0.6rem; }
        .yard-card { margin-top: 0.6rem; }
        .section-title, .yard-title { font-size: 0.85rem; color: var(--text-dim); font-weight: 700; margin-bottom: 0.35rem; }
        .yard-row { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; align-items: center; }
        .yard-select { width: 100%; min-height: 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); }
        .muted-xs { color: var(--muted); font-size: 0.75rem; }
      `}</style>
    </div>
  );
}
