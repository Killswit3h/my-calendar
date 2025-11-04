"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Calendar, CalendarRange, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { TodoItemModel } from "./types";
import { cn } from "@/lib/cn";

type SchedulePanelProps = {
  todos: TodoItemModel[];
  loading?: boolean;
  label: string;
};

type CalendarView = "month" | "week";

type DayBucket = {
  date: Date;
  items: TodoItemModel[];
};

const HOURS = Array.from({ length: 24 }, (_, index) => index);

function bucketByDay(todos: TodoItemModel[], start: Date, end: Date): DayBucket[] {
  const days = eachDayOfInterval({ start, end });
  return days.map((date) => ({
    date,
    items: todos.filter((todo) => todo.dueAt && isSameDay(new Date(todo.dueAt), date)),
  }));
}

function timeLabel(todo: TodoItemModel): string {
  if (!todo.dueAt) return "No due time";
  const due = new Date(todo.dueAt);
  if (due.getHours() === 0 && due.getMinutes() === 0) return "All day";
  return format(due, "p");
}

function timedTasksForDay(todos: TodoItemModel[], day: Date) {
  return todos.filter((todo) => {
    if (!todo.dueAt) return false;
    const due = new Date(todo.dueAt);
    if (!isSameDay(due, day)) return false;
    return due.getHours() !== 0 || due.getMinutes() !== 0;
  });
}

function allDayTasksForDay(todos: TodoItemModel[], day: Date) {
  return todos.filter((todo) => {
    if (!todo.dueAt) return false;
    const due = new Date(todo.dueAt);
    if (!isSameDay(due, day)) return false;
    return due.getHours() === 0 && due.getMinutes() === 0;
  });
}

export default function SchedulePanel({ todos, loading, label }: SchedulePanelProps) {
  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState(new Date());

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(focusDate);
    const monthEnd = endOfMonth(focusDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return bucketByDay(todos, start, end);
  }, [focusDate, todos]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(focusDate, { weekStartsOn: 0 });
    const end = endOfWeek(focusDate, { weekStartsOn: 0 });
    return bucketByDay(todos, start, end);
  }, [focusDate, todos]);

  const handleNavigate = (direction: "prev" | "next") => {
    setFocusDate((current) => {
      if (view === "month") {
        return direction === "prev" ? addMonths(current, -1) : addMonths(current, 1);
      }
      return direction === "prev" ? addWeeks(current, -1) : addWeeks(current, 1);
    });
  };

  const handleToday = () => setFocusDate(new Date());

  return (
    <section className="rounded-3xl border border-white/10 bg-black/40 p-4 text-sm text-white">
      <header className="flex flex-col gap-3 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-white/60">Calendar</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30">
              <CalendarRange className="h-4 w-4 text-emerald-300" />
            </span>
            <h2 className="text-lg font-semibold">{label}</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex items-center overflow-hidden rounded-full border border-white/10 bg-black/30">
            <button
              type="button"
              onClick={() => setView("month")}
              className={cn(
                "px-3 py-1.5 transition",
                view === "month" ? "bg-emerald-500/20 text-emerald-200" : "text-white/70 hover:bg-white/10",
              )}
            >
              <Calendar className="mr-1 inline h-3.5 w-3.5" />
              Month
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={cn(
                "px-3 py-1.5 transition",
                view === "week" ? "bg-emerald-500/20 text-emerald-200" : "text-white/70 hover:bg-white/10",
              )}
            >
              <Clock className="mr-1 inline h-3.5 w-3.5" />
              Week
            </button>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-2 py-1">
            <button
              type="button"
              onClick={() => handleNavigate("prev")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-white/70">{format(focusDate, view === "month" ? "MMMM yyyy" : "'Week of' MMM d")}</span>
            <button
              type="button"
              onClick={() => handleNavigate("next")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-full border border-white/10 px-3 py-1 text-white/70 transition hover:border-white/20 hover:text-white"
            >
              Today
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-xs text-white/60">Loading calendar…</div>
      ) : view === "month" ? (
        <MonthView days={monthDays} focusDate={focusDate} />
      ) : (
        <WeekView days={weekDays} todos={todos} />
      )}
    </section>
  );
}

function MonthView({ days, focusDate }: { days: DayBucket[]; focusDate: Date }) {
  const rows = useMemo(() => {
    const chunks: DayBucket[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      chunks.push(days.slice(index, index + 7));
    }
    return chunks;
  }, [days]);

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-7 gap-2 text-[11px] uppercase tracking-wide text-white/50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label} className="text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map((week, index) => (
          <div key={index} className="grid grid-cols-7 gap-2">
            {week.map((bucket) => (
              <article
                key={bucket.date.toISOString()}
                className={cn(
                  "min-h-[120px] rounded-2xl border border-white/10 bg-black/30 p-2 text-xs transition hover:border-emerald-400/60",
                  !isSameMonth(bucket.date, focusDate) && "opacity-40",
                  isToday(bucket.date) && "border-emerald-400/80 bg-emerald-500/10",
                )}
              >
                <header className="mb-2 flex items-center justify-between">
                  <span className="text-white/80">{format(bucket.date, "d")}</span>
                  {bucket.items.length > 0 ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                      {bucket.items.length}
                    </span>
                  ) : null}
                </header>
                <ul className="space-y-1 text-[11px] text-white/70">
                  {bucket.items.slice(0, 3).map((todo) => (
                    <li
                      key={todo.id}
                      className={cn(
                        "truncate rounded-lg border border-white/10 bg-black/40 px-2 py-1 leading-tight",
                        todo.isCompleted && "opacity-50 line-through",
                      )}
                    >
                      <span className="block font-semibold text-white/80">{todo.title}</span>
                      <span className="text-white/50">{timeLabel(todo)}</span>
                    </li>
                  ))}
                  {bucket.items.length > 3 ? (
                    <li className="truncate text-[10px] text-white/40">+{bucket.items.length - 3} more</li>
                  ) : null}
                </ul>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ days, todos }: { days: DayBucket[]; todos: TodoItemModel[] }) {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-[75px_repeat(7,minmax(0,1fr))] gap-1 text-[11px] uppercase tracking-wide text-white/50">
        <div />
        {days.map((bucket) => (
          <div key={bucket.date.toISOString()} className={cn("text-center", isToday(bucket.date) && "text-emerald-200")}>
            <span className="block text-xs font-semibold text-white/80">{format(bucket.date, "EEE")}</span>
            <span className="text-white/60">{format(bucket.date, "MMM d")}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-[75px_repeat(7,minmax(0,1fr))] gap-1">
        <div className="space-y-6 border-r border-white/10 pr-1 text-[11px] text-white/40">
          {HOURS.map((hour) => (
            <div key={hour} className="h-12">
              {(() => {
                const label = new Date();
                label.setHours(hour, 0, 0, 0);
                return format(label, "h aa");
              })()}
            </div>
          ))}
        </div>
        {days.map((bucket) => {
          const timed = timedTasksForDay(todos, bucket.date);
          const allDay = allDayTasksForDay(todos, bucket.date);
          return (
            <div key={bucket.date.toISOString()} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <div className="absolute inset-x-0 top-0 z-10 space-y-1 border-b border-white/10 bg-black/35 px-2 py-1 text-[11px]">
                {allDay.map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "rounded-md border border-white/10 bg-emerald-500/15 px-2 py-1 font-medium text-white/80",
                      todo.isCompleted && "opacity-50 line-through",
                    )}
                  >
                    {todo.title}
                  </div>
                ))}
              </div>
              <div className="mt-[48px] h-[1152px] space-y-[1px] border-t border-white/10">
                {HOURS.map((hour) => (
                  <div key={hour} className="relative h-12 border-b border-white/5 text-[10px] text-white/20">
                    {timed
                      .filter((todo) => {
                        const due = todo.dueAt ? new Date(todo.dueAt) : null;
                        if (!due) return false;
                        return due.getHours() === hour;
                      })
                      .map((todo) => (
                        <div
                          key={todo.id}
                          className={cn(
                            "absolute inset-x-1 top-1 rounded-lg border border-white/10 bg-emerald-500/20 px-2 py-1 text-[11px] leading-tight text-white/80 shadow-sm",
                            todo.isCompleted && "opacity-50 line-through",
                          )}
                        >
                          <p className="font-semibold">{todo.title}</p>
                          <p className="text-white/60">{timeLabel(todo)}</p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
