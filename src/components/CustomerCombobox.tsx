"use client";
import useSWR from "swr";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = { id: string; name: string };

const fetcher = (url: string) => fetch(url).then(r => r.json());

function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export default function CustomerCombobox({
  value,
  onChange,
  labelId,
  inputId,
  allowCreateOption = false,
}: {
  value: string;
  onChange: (v: string) => void;
  labelId?: string;
  inputId?: string;
  allowCreateOption?: boolean;
}) {
  const [query, setQuery] = useState<string>(value || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number>(-1);
  const [selected, setSelected] = useState<Option | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounced = useDebounced(query, 200);

  const { data } = useSWR<Option[] | { items: Option[] }>(
    `/api/customers?search=${encodeURIComponent(debounced)}&limit=20`,
    fetcher,
    { keepPreviousData: true, dedupingInterval: 5 * 60_000 },
  );

  const items = useMemo(() => {
    if (!data) return [] as Option[];
    if (Array.isArray(data)) return data as Option[];
    const maybeItems = (data as { items?: Option[] }).items;
    return Array.isArray(maybeItems) ? maybeItems : [];
  }, [data]);

  const existingMatch = useMemo(
    () => items.find(i => i.name.toLowerCase() === (debounced || "").toLowerCase()),
    [items, debounced],
  );

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  function commit(val: string) {
    onChange(val);
  }

  async function createAndSelect(name: string) {
    const r = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "create failed");
    setSelected(j);
    commit(j.name);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) setOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(a => Math.min((items.length - 1) + (existingMatch ? 0 : 1), a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active === -1) {
        // Do not commit arbitrary free text; require selecting an existing option
        // Prefer exact match if present, otherwise select the first item if available
        if (existingMatch) {
          setSelected(existingMatch);
          commit(existingMatch.name);
          setOpen(false);
        } else if (items.length > 0) {
          const first = items[0];
          setSelected(first);
          commit(first.name);
          setOpen(false);
        }
        return;
      }
      if (allowCreateOption) {
        const createOptionIndex = items.length;
        if (!existingMatch && active === createOptionIndex) {
          createAndSelect(query).catch(() => {});
          setOpen(false);
          return;
        }
      }
      const opt = items[active];
      if (opt) {
        setSelected(opt);
        commit(opt.name);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" aria-haspopup="listbox" aria-expanded={open}>
      <input
        id={inputId}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={open ? "customer-combobox-list" : undefined}
        aria-labelledby={labelId}
        className="w-full border border-[var(--border)] rounded-[10px] px-[0.65rem] py-[0.55rem] bg-[var(--card-2)] text-[var(--text)]"
        placeholder="Type a customer"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <ul
          id="customer-combobox-list"
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto border border-[var(--border)] rounded-[10px] bg-[var(--card)]"
        >
          {(!items || items.length === 0) && query.trim().length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--muted)]">Start typing to search…</li>
          ) : null}
          {items.map((it, idx) => (
            <li
              key={it.id}
              role="option"
              aria-selected={active === idx}
              onMouseDown={e => {
                e.preventDefault();
                setSelected(it);
                commit(it.name);
                setOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer ${active === idx ? "bg-[var(--elev-2)]" : ""}`}
            >
              {it.name}
            </li>
          ))}
          {allowCreateOption && !existingMatch && query.trim() ? (
            <li
              role="option"
              aria-selected={active === items.length}
              onMouseDown={e => {
                e.preventDefault();
                createAndSelect(query).catch(() => {});
                setOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer ${active === items.length ? "bg-[var(--elev-2)]" : ""}`}
            >
              {`Create "${query.trim()}"`}
            </li>
          ) : null}
          {items.length === 0 && query.trim() ? (
            <li className="px-3 py-2 text-sm text-[var(--muted)]">No matches</li>
          ) : null}
        </ul>
      ) : null}
      <div className="muted-sm mt-1">Select an existing customer from the list.</div>
    </div>
  );
}
