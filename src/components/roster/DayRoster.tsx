"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";

type Section = "YARD_SHOP" | "NO_WORK" | "FREE";
type Emp = { id: string; name: string };
export type DayRosterData = { dateISO: string; free: Emp[]; yardShop: Emp[]; noWork: Emp[] };

const fetcher = (u: string) => fetch(u).then(r => r.json());
async function moveToFreeAPI(input: { employeeId: string; dateISO: string; from: Section }) {
  const res = await fetch("/api/roster/move-to-free", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
}

export default function DayRoster({ initial }: { initial: DayRosterData }) {
  const key = useMemo(() => `/api/roster?date=${encodeURIComponent(initial.dateISO)}`, [initial.dateISO]);
  const { data: server, mutate } = useSWR<DayRosterData>(key, fetcher, { fallbackData: initial, revalidateOnFocus: false });

  const [local, setLocal] = useState<DayRosterData>(server!);
  useEffect(() => { if (server) setLocal(server); }, [server]);

  const [isPending, startTransition] = useTransition();

  function optimisticMove(employeeId: string, from: Section) {
    setLocal(prev => {
      const next: DayRosterData = structuredClone(prev);
      const rm = (xs: Emp[]) => xs.filter(e => e.id !== employeeId);
      let moved: Emp | undefined;

      if (from === "YARD_SHOP") {
        moved = prev.yardShop.find(e => e.id === employeeId);
        next.yardShop = rm(prev.yardShop);
      } else if (from === "NO_WORK") {
        moved = prev.noWork.find(e => e.id === employeeId);
        next.noWork = rm(prev.noWork);
      }

      if (moved && !prev.free.some(e => e.id === employeeId)) next.free = [...prev.free, moved];
      return next;
    });
  }

  function onRemove(employeeId: string, from: Section) {
    console.log("remove click", { employeeId, from, dateISO: local.dateISO });
    const snapshot = local;
    optimisticMove(employeeId, from);
    startTransition(async () => {
      try {
        await moveToFreeAPI({ employeeId, dateISO: local.dateISO, from });
        await mutate();
        console.log("move-to-free succeeded, revalidated");
      } catch (e) {
        console.error("move-to-free failed", e);
        setLocal(snapshot);
      }
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-card">
        <header className="px-3 py-2 text-sm font-semibold">
          Free Employees ({local.free.length})
        </header>
        <ul className="px-3 pb-3">
          {local.free.map(e => <li key={e.id} className="py-1 text-sm">{e.name} <span className="text-muted-foreground">[{e.id}]</span></li>)}
        </ul>
      </section>

      <section className="rounded-lg border bg-card">
        <header className="px-3 py-2 text-sm font-semibold">
          Yard/Shop ({local.yardShop.length})
        </header>
        <ul className="px-3 pb-3 space-y-2">
          {local.yardShop.map(e => (
            <li key={e.id} className="flex items-center justify-between text-sm">
              <span>{e.name} <span className="text-muted-foreground">[{e.id}]</span></span>
              <Button type="button" size="sm" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); onRemove(e.id, "YARD_SHOP"); }} disabled={isPending}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border bg-card">
        <header className="px-3 py-2 text-sm font-semibold">
          No Work ({local.noWork.length})
        </header>
        <ul className="px-3 pb-3 space-y-2">
          {local.noWork.map(e => (
            <li key={e.id} className="flex items-center justify-between text-sm">
              <span>{e.name} <span className="text-muted-foreground">[{e.id}]</span></span>
              <Button type="button" size="sm" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); onRemove(e.id, "NO_WORK"); }} disabled={isPending}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
