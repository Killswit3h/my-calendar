"use client";

import { cn } from "@/lib/theme";
import { PAY_ITEM_LABEL } from "@/components/project/payApplicationConstants";
import type { Phase, PhaseItem } from "@/components/project/payApplicationTypes";

type PhasesViewProps = {
  phaseSearch: string;
  onPhaseSearchChange: (value: string) => void;
  phases: Phase[];
  filteredPhases: Phase[];
  onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  onTogglePhaseBoolean: (phaseId: string, key: "onsiteReview" | "surveyed") => void;
  onUpdatePhaseItem: (phaseId: string, itemId: string, updates: Partial<PhaseItem>) => void;
  onAddPhase: () => void;
  invoiceNumber: string;
};

type StatusTone = {
  pill: string;
  dot: string;
  text: string;
};

function statusTone(status: string): StatusTone {
  const s = status.toLowerCase().trim();
  if (!s) {
    return { pill: "bg-white/10 text-white/70", dot: "bg-white/40", text: "text-white/70" };
  }
  if (s.includes("complete") || s.includes("done") || s.includes("approved")) {
    return { pill: "bg-emerald-500/15 text-emerald-300", dot: "bg-emerald-400", text: "text-emerald-300" };
  }
  if (s.includes("pending") || s.includes("review")) {
    return { pill: "bg-amber-500/15 text-amber-300", dot: "bg-amber-400", text: "text-amber-300" };
  }
  if (s.includes("progress") || s.includes("active") || s.includes("started")) {
    return { pill: "bg-sky-500/15 text-sky-300", dot: "bg-sky-400", text: "text-sky-300" };
  }
  if (s.includes("hold") || s.includes("block") || s.includes("issue")) {
    return { pill: "bg-rose-500/15 text-rose-300", dot: "bg-rose-400", text: "text-rose-300" };
  }
  return { pill: "bg-white/10 text-white", dot: "bg-white/60", text: "text-white" };
}

function FieldShell({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5", className)}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export function PayApplicationPhasesView({
  phaseSearch,
  onPhaseSearchChange,
  phases: _phases,
  filteredPhases,
  onUpdatePhase,
  onTogglePhaseBoolean,
  onUpdatePhaseItem,
  onAddPhase,
  invoiceNumber,
}: PhasesViewProps) {
  void _phases;
  const trimmedInvoice = invoiceNumber.trim();
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Phases</p>
          <p className="text-xs text-white/60">Per-phase quantities, readiness, and notes. Search by phase number/name.</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
          <input
            type="text"
            value={phaseSearch}
            onChange={(event) => onPhaseSearchChange(event.target.value)}
            placeholder="Search phases…"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 md:w-64"
          />
          <button
            type="button"
            onClick={onAddPhase}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            Add Phase
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPhases.map((phase) => {
          const tone = statusTone(phase.status);
          const totalQuantity = phase.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          const totalInstalled = phase.items.reduce((sum, item) => sum + (item.installedQty || 0), 0);
          const totalPct = totalQuantity ? (totalInstalled / totalQuantity) * 100 : 0;
          const itemCount = phase.items.length;

          return (
            <div key={phase.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-nowrap items-center gap-2">
                    <span className="text-lg font-semibold text-white">
                      {trimmedInvoice || <span className="italic text-white/40">Set invoice #</span>}
                    </span>
                    <input
                      type="text"
                      value={phase.invoiceSuffix}
                      onChange={(event) =>
                        onUpdatePhase(phase.id, {
                          invoiceSuffix: event.target.value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3),
                        })
                      }
                      maxLength={3}
                      size={Math.max(phase.invoiceSuffix.length, 1)}
                      aria-label="Invoice letter"
                      placeholder="A"
                      className="h-7 w-auto min-w-[1.75rem] rounded-md border border-white/20 bg-black/30 px-1.5 text-center text-base font-semibold uppercase leading-none text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    />
                  </div>
                  <p className="text-xs text-white/55">Phase prerequisites and locate details</p>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", tone.pill)}>
                  <span className={cn("size-1.5 rounded-full", tone.dot)} />
                  {phase.status?.trim() || "—"}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <FieldShell label="Locate Ticket #" className="lg:col-span-2">
                  <input
                    value={phase.locateTicket}
                    onChange={(event) => onUpdatePhase(phase.id, { locateTicket: event.target.value })}
                    className="w-full bg-transparent text-[13px] leading-tight text-white placeholder:italic placeholder:text-white/40 focus:outline-none"
                    placeholder="Not set"
                  />
                </FieldShell>
                <FieldShell label="Date Created">
                  <input
                    type="date"
                    value={phase.dateCreated}
                    onChange={(event) => onUpdatePhase(phase.id, { dateCreated: event.target.value })}
                    className="w-full bg-transparent py-0 font-mono text-[13px] leading-tight text-white outline-none [color-scheme:dark]"
                  />
                </FieldShell>
                <FieldShell label="Ready to Work">
                  <input
                    type="date"
                    value={phase.readyToWorkDate}
                    onChange={(event) => onUpdatePhase(phase.id, { readyToWorkDate: event.target.value })}
                    className="w-full bg-transparent py-0 font-mono text-[13px] leading-tight text-white outline-none [color-scheme:dark]"
                  />
                </FieldShell>

                <FieldShell label="Onsite Review">
                  <button
                    type="button"
                    onClick={() => onTogglePhaseBoolean(phase.id, "onsiteReview")}
                    className={cn(
                      "text-left text-[13px] font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                      phase.onsiteReview ? "text-emerald-300" : "text-white",
                    )}
                  >
                    {phase.onsiteReview ? "Yes" : "No"}
                  </button>
                </FieldShell>
                <FieldShell label="Surveyed">
                  <button
                    type="button"
                    onClick={() => onTogglePhaseBoolean(phase.id, "surveyed")}
                    className={cn(
                      "text-left text-[13px] font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                      phase.surveyed ? "text-emerald-300" : "text-white",
                    )}
                  >
                    {phase.surveyed ? "Yes" : "No"}
                  </button>
                </FieldShell>
                <FieldShell label="Status">
                  <input
                    value={phase.status}
                    onChange={(event) => onUpdatePhase(phase.id, { status: event.target.value })}
                    className={cn(
                      "w-full bg-transparent text-[13px] font-semibold leading-tight focus:outline-none",
                      tone.text,
                    )}
                    placeholder="Not set"
                  />
                </FieldShell>
                <FieldShell label="Status Date">
                  <input
                    type="date"
                    value={phase.statusDate}
                    onChange={(event) => onUpdatePhase(phase.id, { statusDate: event.target.value })}
                    className="w-full bg-transparent py-0 font-mono text-[13px] leading-tight text-white outline-none [color-scheme:dark]"
                  />
                </FieldShell>

                <FieldShell label="Notes" className="sm:col-span-2 lg:col-span-4">
                  <textarea
                    value={phase.notes ?? ""}
                    onChange={(event) => onUpdatePhase(phase.id, { notes: event.target.value })}
                    rows={2}
                    className="w-full resize-none bg-transparent text-[13px] leading-snug text-white placeholder:italic placeholder:text-white/40 focus:outline-none"
                    placeholder="Add notes for this phase…"
                  />
                </FieldShell>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Pay Items</p>
                  <p className="text-[11px] tabular-nums text-white/55">
                    {itemCount} {itemCount === 1 ? "item" : "items"} · {totalInstalled.toLocaleString()} of {totalQuantity.toLocaleString()} installed
                  </p>
                </div>

                <div className="mt-3 hidden grid-cols-[110px_minmax(0,1fr)_90px_110px_140px_60px] items-center gap-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 md:grid">
                  <span>{PAY_ITEM_LABEL}</span>
                  <span>Description</span>
                  <span className="text-right">Quantity</span>
                  <span className="text-right">Installed</span>
                  <span>Progress</span>
                  <span className="text-right">%</span>
                </div>

                <div className="mt-1">
                  {phase.items.map((item) => {
                    const pct = item.quantity ? Math.min(100, (item.installedQty / item.quantity) * 100) : 0;
                    const itemTone = pct >= 100
                      ? { bar: "bg-emerald-400", text: "text-emerald-300" }
                      : pct >= 50
                        ? { bar: "bg-amber-400", text: "text-amber-300" }
                        : { bar: "bg-white/30", text: "text-white/55" };
                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-2 items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/[0.04] md:grid-cols-[110px_minmax(0,1fr)_90px_110px_140px_60px] md:gap-3 md:py-2"
                      >
                        <div className="font-mono text-[12px] font-semibold tracking-tight text-white">{item.payItem}</div>
                        <div className="min-w-0 truncate text-[13px] text-white/85 md:order-none" title={item.description}>{item.description}</div>
                        <div className="text-right tabular-nums text-white/55">{item.quantity.toLocaleString()}</div>
                        <div className="md:text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.installedQty}
                            onChange={(event) =>
                              onUpdatePhaseItem(phase.id, item.id, {
                                installedQty: Number.isNaN(Number(event.target.value)) ? 0 : Number(event.target.value),
                              })
                            }
                            className="ml-auto h-7 w-full max-w-[100px] rounded-md border border-white/10 bg-black/30 px-2 text-right text-[13px] font-semibold tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                          />
                        </div>
                        <div className="col-span-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07] md:col-span-1">
                          <div
                            className={cn("h-full rounded-full transition-all duration-300", itemTone.bar)}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${item.description} progress`}
                          />
                        </div>
                        <div className={cn("col-span-2 text-right text-[13px] font-bold tabular-nums md:col-span-1", itemTone.text)}>
                          {pct.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                  {phase.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/15 bg-black/20 px-3 py-3 text-xs text-white/50">
                      No pay items in this phase yet.
                    </div>
                  ) : null}
                </div>

                {phase.items.length > 0 ? (
                  <div className="mt-2 hidden grid-cols-[110px_minmax(0,1fr)_90px_110px_140px_60px] items-center gap-3 border-t border-white/10 px-3 pt-3 text-sm md:grid">
                    <div className="font-semibold text-white">Total</div>
                    <div />
                    <div className="text-right tabular-nums text-white">{totalQuantity.toLocaleString()}</div>
                    <div className="text-right tabular-nums text-white">{totalInstalled.toLocaleString()}</div>
                    <div />
                    <div className={cn("text-right text-[13px] font-bold tabular-nums",
                      totalPct >= 100 ? "text-emerald-300" : totalPct >= 50 ? "text-amber-300" : "text-white/55",
                    )}>
                      {totalPct.toFixed(1)}%
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {!filteredPhases.length ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">No phases match your search.</div>
        ) : null}
      </div>
    </div>
  );
}
