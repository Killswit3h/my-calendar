"use client";

import { useMemo, useState } from "react";
import type { Employee } from "../employees";

type Props = {
  employees: Employee[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  label?: string;
};

function normalize(text: string): string {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function EmployeeMultiSelect({
  employees,
  value,
  onChange,
  placeholder = "Search employees…",
  label,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = normalize(query);
    if (!term) return employees;
    return employees.filter(emp => {
      const full = normalize(`${emp.firstName} ${emp.lastName}`);
      const team = normalize(emp.team);
      const initials = `${emp.firstName[0] ?? ""}${emp.lastName[0] ?? ""}`.toLowerCase();
      return full.includes(term) || team.includes(term) || initials.includes(term);
    });
  }, [employees, query]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggle = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(Array.from(next));
  };

  const selectAllFiltered = () => {
    const ids = filtered.map(emp => emp.id);
    const next = new Set(selectedSet);
    ids.forEach(id => next.add(id));
    onChange(Array.from(next));
  };

  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {label ? <span className="text-xs uppercase tracking-[0.2em] text-muted">{label}</span> : null}
        <div className="flex items-center gap-2 text-xs">
          {value.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="text-muted hover:text-foreground transition"
            >
              Clear all
            </button>
          ) : null}
          {filtered.length > value.length ? (
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-muted hover:text-foreground transition"
            >
              Select visible
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-border/70 bg-white/5 px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
          {filtered.length} results
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted">
        {value.length ? (
          employees
            .filter(emp => selectedSet.has(emp.id))
            .map(emp => (
              <span
                key={emp.id}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-foreground/10 px-3 py-1"
              >
                <span className="text-foreground">{emp.firstName} {emp.lastName}</span>
                <button
                  type="button"
                  className="text-muted hover:text-foreground transition"
                  onClick={() => toggle(emp.id)}
                  aria-label={`Remove ${emp.firstName} ${emp.lastName}`}
                >
                  ×
                </button>
              </span>
            ))
        ) : (
          <span className="text-muted">
            No employees selected. Use the list below to assign.
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-surface-soft/50">
        <ul className="max-h-64 overflow-y-auto divide-y divide-border/40">
          {filtered.length ? (
            filtered.map(emp => {
              const checked = selectedSet.has(emp.id);
              return (
                <li
                  key={emp.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-muted hover:bg-white/5"
                >
                  <label className="flex flex-1 items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(emp.id)}
                      className="size-4 rounded border border-border bg-transparent accent-accent"
                    />
                    <span className="flex flex-col leading-tight">
                      <span className="text-foreground font-medium">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="text-xs text-muted">
                        {emp.team} • {emp.id}
                      </span>
                    </span>
                  </label>
                  {checked ? (
                    <span className="text-xs text-accent font-semibold uppercase tracking-wide">
                      Assigned
                    </span>
                  ) : null}
                </li>
              );
            })
          ) : (
            <li className="px-3 py-6 text-sm text-muted text-center">No employees match “{query}”.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
