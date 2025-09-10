"use client";

import { useState, useRef, useEffect } from "react";
import type { Employee } from "../employees";

interface Props {
  employees: Employee[];
  value: string[];
  onChange: (next: string[]) => void;
  assignedEmployeeIds?: string[];
  conflictPolicy?: "disable" | "warn";
  groupByTeam?: boolean;
  placeholder?: string;
  label?: string;
}

export default function EmployeeMultiSelect({
  employees,
  value,
  onChange,
  assignedEmployeeIds = [],
  conflictPolicy = "warn",
  groupByTeam = false,
  placeholder = "Select employees",
  label,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = employees.filter((e) =>
    `${e.firstName} ${e.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const ordered = groupByTeam
    ? filtered.sort((a, b) => a.team.localeCompare(b.team))
    : filtered;

  const flat = ordered;

  const toggle = (id: string, disabled?: boolean) => {
    if (disabled) return;
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  useEffect(() => {
    if (open) setActive(0);
  }, [open, search]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (!open || !flat.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % flat.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + flat.length) % flat.length);
      } else if (e.key === " ") {
        e.preventDefault();
        const emp = flat[active];
        if (emp) {
          const busy = assignedEmployeeIds.includes(emp.id);
          const disabled = busy && conflictPolicy === "disable";
          toggle(emp.id, disabled);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        const emp = flat[active];
        if (emp) {
          const busy = assignedEmployeeIds.includes(emp.id);
          const disabled = busy && conflictPolicy === "disable";
          toggle(emp.id, disabled);
        }
        setOpen(false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, active, flat, assignedEmployeeIds, conflictPolicy, value]);

  const renderRow = (e: Employee, idx: number) => {
    const busy = assignedEmployeeIds.includes(e.id);
    const disabled = busy && conflictPolicy === "disable";
    const selected = value.includes(e.id);
    const highlight = idx === active;
  return (
      <li
        key={e.id}
        role="option"
        aria-selected={selected}
        onMouseEnter={() => setActive(idx)}
        onClick={() => toggle(e.id, disabled)}
        className={`emp-ms-option${highlight ? " active" : ""}${disabled ? " disabled" : ""}`}
      >
        <div className="emp-ms-option-left">
          <input
            type="checkbox"
            checked={selected}
            readOnly
            disabled={disabled}
          />
          <span>{e.firstName} {e.lastName}</span>
        </div>
        {busy && (
          <span className="emp-ms-busy">
            {conflictPolicy === "warn" ? "Busy (warn)" : "Busy"}
          </span>
        )}
      </li>
    );
  };

  const sections: { title: string; items: Employee[] }[] = [];
  if (groupByTeam) {
    const south = ordered.filter((e) => e.team === "South");
    const central = ordered.filter((e) => e.team === "Central");
    if (south.length) sections.push({ title: "South FL Team", items: south });
    if (central.length) sections.push({ title: "Central FL Team", items: central });
  }

  const listContent = groupByTeam ? (
    sections.map((s) => (
      <div key={s.title}>
        <div className="emp-ms-section-title">{s.title}</div>
        <ul className="emp-ms-grid">
          {s.items.map((e) => renderRow(e, flat.indexOf(e)))}
        </ul>
      </div>
    ))
  ) : (
    <ul className="emp-ms-grid">{flat.map((e, idx) => renderRow(e, idx))}</ul>
  );

  const labelText = label && <label className="block text-sm mb-1">{label}</label>;
  const buttonText = value.length
    ? employees
        .filter((e) => value.includes(e.id))
        .map((e) => `${e.firstName} ${e.lastName}`)
        .join(", ")
    : placeholder;

  return (
    <div className="emp-ms" ref={containerRef}>
      {labelText}
      <button
        type="button"
        className="emp-ms-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {buttonText}
      </button>
      {open && (
        <div className="emp-ms-menu" role="listbox" aria-multiselectable="true">
          <div className="emp-ms-search">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="emp-ms-search-input"
            />
            <button
              type="button"
              className="emp-ms-clear"
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          </div>
          <div className="emp-ms-options">{listContent}</div>
        </div>
      )}
    </div>
  );
}

