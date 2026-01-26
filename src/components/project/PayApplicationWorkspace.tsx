"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/theme";
import type { QuantityItem } from "@/components/project/ProjectQuantitiesCard";

type ChecklistStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

type StockpileEntry = {
  id: string;
  payItem: string;
  description: string;
  quantity: number;
  amount: number;
};

type ChangeOrderEntry = {
  id: string;
  payItem: string;
  description: string;
  quantity: number;
  rate: number;
};

type PhaseItem = {
  id: string;
  payItem: string;
  description: string;
  quantity: number;
  installedQty: number;
};

type Phase = {
  id: string;
  name: string;
  locateTicket: string;
  dateCreated: string;
  readyToWorkDate: string;
  onsiteReview: boolean;
  surveyed: boolean;
  status: string;
  statusDate: string;
  notes?: string;
  items: PhaseItem[];
};

const CHECKLIST_ITEMS = [
  { key: "contract", label: "Contract Signed" },
  { key: "coi", label: "COI" },
  { key: "bond", label: "Bond" },
  { key: "material", label: "Material Compliance Forms" },
  { key: "eeo", label: "EEO Compliance" },
  { key: "payroll", label: "Payroll" },
] as const;

const PAY_ITEM_LABEL = "Pay Item";

const STATUS_LABEL: Record<ChecklistStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};

const STATUS_CLASS: Record<ChecklistStatus, string> = {
  NOT_STARTED: "bg-white/10 text-white",
  IN_PROGRESS: "bg-amber-500/20 text-amber-200",
  COMPLETE: "bg-emerald-500/20 text-emerald-200",
};

const PAY_ITEM_RATES: Record<string, number> = {
  "536-8-114": 85.0,
  "536-8-432": 112.0,
  "700-1-11": 9500.0,
  "550-5-125": 120.0,
  "550-7-330": 145.0,
  "999-25": 15000.0,
};

const CHANGE_ORDERS: ChangeOrderEntry[] = [
  { id: "co-1", payItem: "536-8-999", description: "Guardrail Specialty Bracing", quantity: 60, rate: 130 },
  { id: "co-2", payItem: "700-1-12", description: "Additional MOT", quantity: 0.55, rate: 9500 },
];

function percent(installed: number, contract: number) {
  if (!contract) return "0%";
  const value = Math.min(100, (installed / contract) * 100);
  return `${value.toFixed(1)}%`;
}

function currency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export type PayApplicationView = "contract" | "phases";

export function PayApplicationWorkspace({
  payItems,
  viewMode,
  prefillData = true,
}: {
  payItems: QuantityItem[];
  viewMode: PayApplicationView;
  prefillData?: boolean;
}) {
  const [statusMap, setStatusMap] = useState<Record<string, ChecklistStatus>>(() =>
    CHECKLIST_ITEMS.reduce(
      (acc, item) => ({
        ...acc,
        [item.key]: "NOT_STARTED" as ChecklistStatus,
      }),
      {},
    ),
  );
  const [notes, setNotes] = useState("");
  const [phaseSearch, setPhaseSearch] = useState("");

  const enrichedPayItems = useMemo(
    () =>
      payItems.map((item) => ({
        ...item,
        rate: PAY_ITEM_RATES[item.payItem] ?? 0,
      })),
    [payItems],
  );

  const buildInitialPhases = (items: typeof enrichedPayItems): Phase[] => {
    if (!prefillData) return [];
    const baseItems = items.slice(0, 2);
    const extraItems = items.slice(2, 4);
    return [
      {
        id: "phase-1",
        name: "Phase 1",
        locateTicket: "TCK-48213",
        dateCreated: "2025-12-01",
        readyToWorkDate: "2025-12-04",
        onsiteReview: true,
        surveyed: true,
        status: "Ready",
        statusDate: "2025-12-05",
        notes: "Northbound alignment; ensure MOT update before pour.",
        items: baseItems.map((item, idx) => ({
          id: `p1-${idx}`,
          payItem: item.payItem,
          description: item.description,
          quantity: item.contractQty,
          installedQty: item.installedQty,
        })),
      },
      {
        id: "phase-2",
        name: "Phase 2",
        locateTicket: "TCK-48277",
        dateCreated: "2025-12-06",
        readyToWorkDate: "2025-12-10",
        onsiteReview: false,
        surveyed: true,
        status: "Pending",
        statusDate: "2025-12-11",
        notes: "Southbound; await utility clearance.",
        items: extraItems.length
          ? extraItems.map((item, idx) => ({
              id: `p2-${idx}`,
              payItem: item.payItem,
              description: item.description,
              quantity: item.contractQty,
              installedQty: item.installedQty,
            }))
          : baseItems.map((item, idx) => ({
              id: `p2-fallback-${idx}`,
              payItem: item.payItem,
              description: item.description,
              quantity: Math.round(item.contractQty / 2),
              installedQty: Math.round(item.installedQty / 2),
            })),
      },
    ];
  };

  const [phases, setPhases] = useState<Phase[]>(() => buildInitialPhases(enrichedPayItems));
  const [customContractItems, setCustomContractItems] = useState<QuantityItem[]>([]);
  const [showContractForm, setShowContractForm] = useState(false);
  const [newContractItem, setNewContractItem] = useState({
    payItem: "",
    description: "",
    contractQty: "",
    installedQty: "",
  });
  const [stockpileAmounts, setStockpileAmounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setPhases(buildInitialPhases(enrichedPayItems));
  }, [enrichedPayItems, prefillData]);

  const updatePhase = (phaseId: string, updates: Partial<Phase>) => {
    setPhases((prev) => prev.map((phase) => (phase.id === phaseId ? { ...phase, ...updates } : phase)));
  };

  const togglePhaseBoolean = (phaseId: string, key: "onsiteReview" | "surveyed") => {
    setPhases((prev) =>
      prev.map((phase) => (phase.id === phaseId ? { ...phase, [key]: !phase[key] } : phase)),
    );
  };

  const updatePhaseItem = (phaseId: string, itemId: string, updates: Partial<PhaseItem>) => {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              items: phase.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
            }
          : phase,
      ),
    );
  };

  const filteredPhases = useMemo(() => {
    if (!phaseSearch.trim()) return phases;
    const term = phaseSearch.toLowerCase();
    return phases.filter((phase) => phase.name.toLowerCase().includes(term));
  }, [phaseSearch, phases]);

  const contractItems = useMemo(
    () => [...enrichedPayItems, ...customContractItems],
    [enrichedPayItems, customContractItems],
  );

  useEffect(() => {
    setStockpileAmounts((prev) => {
      const next: Record<string, number> = {};
      contractItems.forEach((item) => {
        next[item.id] = prev[item.id] ?? 0;
      });
      return next;
    });
  }, [contractItems]);

  const stockpileEntries: StockpileEntry[] = useMemo(
    () =>
      contractItems.map((item) => ({
        id: item.id,
        payItem: item.payItem,
        description: item.description,
        quantity: item.contractQty,
        amount: stockpileAmounts[item.id] ?? 0,
      })),
    [contractItems, stockpileAmounts],
  );

  const handleAddContractItem = (event: React.FormEvent) => {
    event.preventDefault();
    const contractQty = Number(newContractItem.contractQty);
    const installedQty = Number(newContractItem.installedQty);
    if (!newContractItem.payItem.trim() || Number.isNaN(contractQty) || contractQty < 0) return;
    const item: QuantityItem = {
      id: `custom-${Date.now()}`,
      payItem: newContractItem.payItem.trim(),
      description: newContractItem.description.trim() || "Added pay item",
      contractQty,
      installedQty: Number.isNaN(installedQty) || installedQty < 0 ? 0 : installedQty,
    };
    setCustomContractItems((prev) => [...prev, item]);
    setNewContractItem({ payItem: "", description: "", contractQty: "", installedQty: "" });
    setShowContractForm(false);
  };

  const toggleStatus = (key: string) => {
    setStatusMap((prev) => {
      const order: ChecklistStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"];
      const next = order[(order.indexOf(prev[key]) + 1) % order.length];
      return { ...prev, [key]: next };
    });
  };

  const handleExport = () => {
    // Frontend-only placeholder; backend export will be wired later.
    window?.alert?.("Pay application CSV export placeholder (frontend-only).");
  };

  const handleAddPhase = () => {
    const nextIndex = phases.length + 1;
    const fallbackItems = enrichedPayItems.slice(0, 2).map((item, idx) => ({
      id: `p${nextIndex}-item-${idx}`,
      payItem: item.payItem,
      description: item.description,
      quantity: item.contractQty,
      installedQty: item.installedQty,
    }));
    setPhases((prev) => [
      ...prev,
      {
        id: `phase-${nextIndex}`,
        name: `Phase ${nextIndex}`,
        locateTicket: "",
        dateCreated: "",
        readyToWorkDate: "",
        onsiteReview: false,
        surveyed: false,
        status: "Pending",
        statusDate: "",
        notes: "",
        items: fallbackItems,
      },
    ]);
  };

  return (
    <section className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/60">Projects / Pay Application Workspace</p>
          <h1 className="text-2xl font-semibold text-white">Pay Application Workspace</h1>
          <p className="text-sm text-white/60">Checklist, quantities, stockpile, change orders, phases, and CSV export.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-[rgba(18,115,24,1)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            Create Pay Application CSV
          </button>
        </div>
      </header>

      {viewMode === "contract" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Procedure Check List</p>
              <p className="text-xs text-white/60">Status boxes for pre-mobilization items.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHECKLIST_ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <span className="text-sm font-medium text-white/90">{item.label}</span>
                <button
                  type="button"
                  onClick={() => toggleStatus(item.key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                    STATUS_CLASS[statusMap[item.key]],
                  )}
                >
                  {STATUS_LABEL[statusMap[item.key]]}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Notes / Other Information</p>
              <p className="text-xs text-white/60">Quick notes for this pay application.</p>
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={8}
            placeholder="Add notes about stockpile deductions, phase readiness, or CO references…"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
          />
        </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-white">Contract Quantities</p>
            <p className="text-xs text-white/60">From calendar-installed quantities; completion is installed vs contract.</p>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowContractForm((prev) => !prev)}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              {showContractForm ? "Close" : "Add Pay Item"}
            </button>
          </div>
          {showContractForm ? (
            <form onSubmit={handleAddContractItem} className="mb-4 space-y-3 rounded-xl border border-white/15 bg-black/25 p-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/60">{PAY_ITEM_LABEL}</label>
                <input
                  value={newContractItem.payItem}
                  onChange={(event) => setNewContractItem((prev) => ({ ...prev, payItem: event.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  placeholder="e.g., 536-8-114"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/60">Description</label>
                <input
                  value={newContractItem.description}
                  onChange={(event) => setNewContractItem((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  placeholder="Work description"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/60">Contract Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newContractItem.contractQty}
                    onChange={(event) => setNewContractItem((prev) => ({ ...prev, contractQty: event.target.value }))}
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/60">Installed Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newContractItem.installedQty}
                    onChange={(event) => setNewContractItem((prev) => ({ ...prev, installedQty: event.target.value }))}
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                >
                  Save Pay Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowContractForm(false);
                    setNewContractItem({ payItem: "", description: "", contractQty: "", installedQty: "" });
                  }}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
          <div className="hidden text-xs text-white/60 md:grid md:grid-cols-[1fr,1.6fr,0.8fr,0.8fr,0.7fr] md:gap-2">
            <span>{PAY_ITEM_LABEL}</span>
            <span>Description</span>
            <span className="text-right">Contract</span>
            <span className="text-right">Installed</span>
            <span className="text-right">Completion</span>
          </div>
          <div className="mt-2 space-y-3">
            {contractItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm md:grid md:grid-cols-[1fr,1.6fr,0.8fr,0.8fr,0.7fr] md:items-center md:gap-2"
              >
                <div className="font-semibold text-white">{item.payItem}</div>
                <div className="text-white/70">{item.description}</div>
                <div className="mt-2 text-white/70 md:mt-0 md:text-right">{item.contractQty.toLocaleString()}</div>
                <div className="text-white md:text-right">{item.installedQty.toLocaleString()}</div>
                <div className="mt-2 text-right text-white/80 md:mt-0">{percent(item.installedQty, item.contractQty)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-white">Stockpile</p>
            <p className="text-xs text-white/60">Enter stockpiled quantities; unit-rate deductions are shown.</p>
          </div>
          <div className="hidden text-xs text-white/60 md:grid md:grid-cols-[1fr,1.3fr,0.65fr,0.65fr,1.4fr] md:gap-2">
            <span>{PAY_ITEM_LABEL}</span>
            <span>Description</span>
            <span className="text-center">Contract Qty</span>
            <span className="text-right">Purchased Qty</span>
            <span className="text-center">Rate / Deduction</span>
          </div>
          <div className="mt-2 space-y-3">
            {stockpileEntries.map((entry) => {
              const amount = stockpileAmounts[entry.id] ?? 0;
              const rate = entry.quantity ? amount / entry.quantity : 0;

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm md:grid md:grid-cols-[1fr,1.3fr,0.65fr,0.65fr,1.4fr] md:items-center md:gap-2"
                >
                  <div className="font-semibold text-white">{entry.payItem}</div>
                  <div className="text-white/70">{entry.description}</div>
                  <div className="mt-2 text-white/70 md:mt-0 md:text-center">{entry.quantity.toLocaleString()}</div>
                  <div className="mt-2 text-white/70 md:mt-0 md:text-center md:flex md:justify-center">
                    <label className="sr-only" htmlFor={`stockpile-purchased-${entry.id}`}>
                      Purchased quantity for {entry.payItem}
                    </label>
                    <input
                      id={`stockpile-purchased-${entry.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={(stockpileAmounts[`purchased-${entry.id}`] ?? 0).toString()}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setStockpileAmounts((prev) => ({
                          ...prev,
                          [`purchased-${entry.id}`]: Number.isNaN(value) || value < 0 ? 0 : value,
                        }));
                      }}
                      className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 md:w-24"
                      placeholder="0.00"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="mt-2 text-white md:mt-0 md:text-center">
                    <div className="flex flex-col items-center gap-1">
                      <label className="sr-only" htmlFor={`stockpile-amount-${entry.id}`}>
                        Stockpile amount for {entry.payItem}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/70">$</span>
                        <input
                          id={`stockpile-amount-${entry.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setStockpileAmounts((prev) => ({
                              ...prev,
                              [entry.id]: Number.isNaN(value) || value < 0 ? 0 : value,
                            }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 md:w-32"
                          placeholder="0.00"
                          inputMode="decimal"
                        />
                        <div className="text-xs text-white/60">Rate {entry.quantity ? currency(rate) : "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 lg:col-span-2">
          <div className="mb-3">
            <p className="text-sm font-semibold text-white">Change Orders</p>
            <p className="text-xs text-white/60">Separate CO pay items and quantities.</p>
          </div>
          <div className="hidden text-xs text-white/60 md:grid md:grid-cols-[1fr,1.6fr,0.8fr,0.8fr] md:gap-2">
            <span>{PAY_ITEM_LABEL}</span>
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate / Amount</span>
          </div>
          <div className="mt-2 space-y-3">
            {prefillData && CHANGE_ORDERS.length > 0 ? (
              CHANGE_ORDERS.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm md:grid md:grid-cols-[1fr,1.6fr,0.8fr,0.8fr] md:items-center md:gap-2"
                >
                  <div className="font-semibold text-white">{entry.payItem}</div>
                  <div className="text-white/70">{entry.description}</div>
                  <div className="mt-2 text-white/70 md:mt-0 md:text-right">{entry.quantity.toLocaleString()}</div>
                  <div className="mt-2 text-right text-white md:mt-0">
                    <div className="text-xs text-white/60">Rate {currency(entry.rate)}</div>
                    <div className="font-semibold text-white">{currency(entry.quantity * entry.rate)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-3 text-sm text-white/60">
                No change orders added yet.
              </div>
            )}
          </div>
        </div>
        </div>
        </>
      ) : null}

      {viewMode === "phases" ? (
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
              onChange={(event) => setPhaseSearch(event.target.value)}
              placeholder="Search phases…"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 md:w-64"
            />
            <button
              type="button"
              onClick={handleAddPhase}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              Add Phase
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredPhases.map((phase) => (
            <div key={phase.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-4 lg:grid-cols-[1.1fr,1fr]">
                <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-semibold text-white">{phase.name}</p>
                    <p className="text-xs text-white/60">Phase prerequisites and locate details</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white/60">Locate Ticket #</p>
                      <input
                        value={phase.locateTicket}
                        onChange={(event) => updatePhase(phase.id, { locateTicket: event.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                        placeholder="Enter locate ticket #"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white/60">Date Created</p>
                      <input
                        type="date"
                        value={phase.dateCreated}
                        onChange={(event) => updatePhase(phase.id, { dateCreated: event.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs font-semibold text-white/60">Ready to Work Date</p>
                      <input
                        type="date"
                        value={phase.readyToWorkDate}
                        onChange={(event) => updatePhase(phase.id, { readyToWorkDate: event.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-white/10 bg-black/10 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white/60">Onsite Review</p>
                      <button
                        type="button"
                        onClick={() => togglePhaseBoolean(phase.id, "onsiteReview")}
                        className={cn(
                          "inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                          phase.onsiteReview ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/80 hover:bg-white/15",
                        )}
                      >
                        {phase.onsiteReview ? "Yes" : "No"}
                      </button>
                    </div>
                    <div className="space-y-1 sm:row-span-2">
                      <p className="text-xs font-semibold text-white/60">Notes</p>
                      <textarea
                        value={phase.notes ?? ""}
                        onChange={(event) => updatePhase(phase.id, { notes: event.target.value })}
                        rows={4}
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                        placeholder="Add notes for this phase…"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white/60">Surveyed</p>
                      <button
                        type="button"
                        onClick={() => togglePhaseBoolean(phase.id, "surveyed")}
                        className={cn(
                          "inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                          phase.surveyed ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/80 hover:bg-white/15",
                        )}
                      >
                        {phase.surveyed ? "Yes" : "No"}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1.1fr,1fr]">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white/60">Status</p>
                      <input
                        value={phase.status}
                        onChange={(event) => updatePhase(phase.id, { status: event.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                        placeholder="Status"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white/60">Status Date</p>
                      <input
                        type="date"
                        value={phase.statusDate}
                        onChange={(event) => updatePhase(phase.id, { statusDate: event.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="hidden text-xs text-white/60 md:grid md:grid-cols-[1fr,1.6fr,0.8fr,0.8fr] md:gap-2">
                  <span>{PAY_ITEM_LABEL}</span>
                  <span>Description</span>
                  <span className="text-right">Quantity</span>
                  <span className="text-right">Installed</span>
                </div>
                <div className="space-y-3">
                  {phase.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm md:grid md:grid-cols-[1fr,1.6fr,0.8fr,0.8fr] md:items-center md:gap-2"
                    >
                      <div className="font-semibold text-white">{item.payItem}</div>
                      <div className="text-white/70">{item.description}</div>
                      <div className="mt-2 md:mt-0 md:text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) =>
                            updatePhaseItem(phase.id, item.id, {
                              quantity: Number.isNaN(Number(event.target.value)) ? 0 : Number(event.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-right text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                        />
                      </div>
                      <div className="text-white md:text-right">{item.installedQty.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {!filteredPhases.length ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">No phases match your search.</div>
          ) : null}
        </div>
      </div>
      ) : null}
    </section>
  );
}

export default PayApplicationWorkspace;

