// components/calendar/MonthGrid.tsx
"use client";

import React, { useMemo } from "react";
import { addDays, endOfMonth, startOfMonth } from "date-fns";
import { getEventsOverlappingRange } from "@/lib/events";
import { daySpanInclusive, clampToRange, weekStart } from "@/lib/dateUtils";

type CalEvent = {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  color?: string;
};

type Props = { monthDate: Date; events: CalEvent[] }; 
// pass events from server using getEventsOverlappingRange

export function MonthGrid({ monthDate, events }: Props) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  // Build weeks covering the whole month (always 6 rows for stable layout)
  const firstGridDay = weekStart(monthStart);
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(firstGridDay, i));

  // Group events by week and assign lanes
  const weekRows = useMemo(() => {
    const rows: { dayIndex: number; items: any[] }[] = [];
    for (let w = 0; w < 6; w++) {
      const weekStartDay = addDays(firstGridDay, w * 7);
      const weekEndDay = addDays(weekStartDay, 6);

      // events overlapping this week
      const weekEvents = events
        .map(e => ({
          ...e,
          _s: new Date(e.startsAt as any),
          _e: new Date(e.endsAt as any),
        }))
        .filter(e => !(e._e < weekStartDay || e._s > addDays(weekEndDay, 1)));

      // For each event, clamp to week and compute span within week
      const items = weekEvents.map(e => {
        const { s, e: ce } = clampToRange(e._s, e._e, weekStartDay, addDays(weekEndDay, 1));
        // convert to grid column [1..7], inclusive days
        const startCol = Math.max(1, (Math.floor((s.getTime() - weekStartDay.getTime()) / 86400000)) + 1);
        const endColExclusive = Math.min(8, (Math.floor((ce.getTime() - weekStartDay.getTime()) / 86400000)) + 1);
        const span = Math.max(1, endColExclusive - startCol);
        return { id: e.id, title: e.title, startCol, span, color: e.color ?? undefined };
      });

      // Lane packing: greedy
      const lanes: { endCol: number; items: typeof items }[] = [];
      const placed: any[] = [];
      for (const it of items.sort((a,b)=> a.startCol - b.startCol || b.span - a.span)) {
        let laneIndex = lanes.findIndex(l => l.endCol <= it.startCol);
        if (laneIndex === -1) {
          laneIndex = lanes.length;
          lanes.push({ endCol: 0, items: [] });
        }
        lanes[laneIndex].endCol = it.startCol + it.span;
        placed.push({ ...it, lane: laneIndex });
      }

      rows.push({ dayIndex: w * 7, items: placed });
    }
    return rows;
  }, [events, firstGridDay]);

  return (
    <div className="grid grid-cols-7 gap-px border border-neutral-700 bg-neutral-700">
      {days.map((d, i) => (
        <div key={i} className="min-h-28 bg-neutral-900 p-1">
          <div className="text-[10px] opacity-70">{d.getDate()}</div>
          {/* lane container */}
          <div className="relative mt-1 space-y-1">
            {/* render week bars only once per week cell 0..6 */}
            {i % 7 === 0 &&
              (() => {
                const week = weekRows[i / 7 | 0];
                return (
                  <div className="absolute inset-x-0 top-4">
                    {/*  each lane is its own block with CSS grid of 7 columns */}
                    {Array.from(new Set(week.items.map(x => x.lane))).map(lane => (
                      <div className="grid grid-cols-7 gap-1 mb-1" key={lane}>
                        {week.items.filter(x => x.lane === lane).map(x => (
                          <div
                            key={x.id}
                            className="h-6 rounded px-2 text-[11px] truncate event-bar"
                            style={{
                              gridColumn: `${x.startCol} / span ${x.span}`,
                              background: x.color ?? "rgba(0,140,120,0.35)",
                              border: "1px solid rgba(0,140,120,0.7)",
                            }}
                            title={x.title}
                          >
                            {x.title}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
          </div>
        </div>
      ))}
    </div>
  );
}

// Keep the old interface for backward compatibility
export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
}

export type DayCell = {
  date: string
  events: CalendarEvent[]
  holiday?: { name: string; localName: string } | null
}

export default MonthGrid;
