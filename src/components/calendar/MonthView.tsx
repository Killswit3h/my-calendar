"use client";
import React, { useMemo } from "react";
import { addDays, endOfMonth, startOfMonth } from "date-fns";
import {
  CalEvent,
  clampToRangeInclusive,
  inclusiveSpanDays,
  weekStartSunday,
} from "@/lib/events";

type Props = {
  monthDate: Date;
  events: CalEvent[];
  onEventClick?: (e: CalEvent) => void;
};

export default function MonthView({ monthDate, events, onEventClick }: Props) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd   = endOfMonth(monthDate);
  const firstGridDay = weekStartSunday(monthStart);
  const days = Array.from({ length: 42 }, (_, i) => addDays(firstGridDay, i));

  const weekRows = useMemo(() => {
    const rows: Array<{ y: number; bars: Array<{ id: string; title: string; startCol: number; span: number; color?: string | null; e: CalEvent }> }> = [];
    for (let w = 0; w < 6; w++) {
      const wkStart = addDays(firstGridDay, w * 7);
      const wkEnd   = addDays(wkStart, 6);
      const wkEndExclusive = addDays(wkEnd, 1);

      // events that overlap this week
      const weekEvents = events.filter(ev => !(ev.endsAt <= wkStart || ev.startsAt >= wkEndExclusive));

      // convert to bars clamped to this week
      const bars = weekEvents.map(e => {
        const { start, end } = clampToRangeInclusive(e.startsAt, e.endsAt, wkStart, wkEndExclusive);
        const startCol = Math.max(1, Math.floor((start.getTime() - wkStart.getTime()) / 86_400_000) + 1);
        const span = Math.min(7 - startCol + 1, inclusiveSpanDays(start, new Date(end.getTime() - 1)));
        return { id: e.id, title: e.title, startCol, span, color: (e as any).color ?? null, e };
      });

      // pack lanes greedily
      const placed: typeof bars = [];
      const laneEnd: number[] = [];
      bars.sort((a,b) => a.startCol - b.startCol || b.span - a.span).forEach(bar => {
        let lane = laneEnd.findIndex(endCol => endCol <= bar.startCol);
        if (lane === -1) { lane = laneEnd.length; laneEnd.push(0); }
        laneEnd[lane] = bar.startCol + bar.span;
        (bar as any).lane = lane;
        placed.push(bar);
      });

      rows.push({ y: w, bars: placed });
    }
    return rows;
  }, [events, firstGridDay]);

  return (
    <div className="grid grid-cols-7 gap-px border border-neutral-700 bg-neutral-700">
      {days.map((d, i) => (
        <div key={i} className="min-h-28 bg-neutral-900 p-1 relative">
          <div className="text-[10px] opacity-70">{d.getDate()}</div>

          {i % 7 === 0 && (() => {
            const row = weekRows[Math.floor(i / 7)];
            const lanes = Array.from(new Set(row.bars.map(b => (b as any).lane)));
            return (
              <div className="absolute left-1 right-1 top-5">
                {lanes.map(lane => (
                  <div className="grid grid-cols-7 gap-1 mb-1" key={lane}>
                    {row.bars.filter(b => (b as any).lane === lane).map(b => (
                      <button
                        key={b.id}
                        onClick={() => onEventClick?.(b.e)}
                        className="h-6 rounded px-2 text-[11px] truncate"
                        style={{
                          gridColumn: `${b.startCol} / span ${b.span}`,
                          background: b.color ?? "rgba(0,140,120,0.35)",
                          border: "1px solid rgba(0,140,120,0.7)",
                        }}
                        title={b.title}
                      >
                        {b.title}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
