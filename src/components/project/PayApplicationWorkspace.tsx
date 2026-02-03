"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuantityItem } from "@/components/project/ProjectQuantitiesCard";
import { PayApplicationContractView } from "@/components/project/PayApplicationContractView";
import { PayApplicationPhasesView } from "@/components/project/PayApplicationPhasesView";
import { CHECKLIST_ITEMS, PAY_ITEM_RATES } from "@/components/project/payApplicationConstants";
import type {
  ChecklistStatus,
  NewContractItem,
  Phase,
  PhaseItem,
  StockpileEntry,
} from "@/components/project/payApplicationTypes";

export type PayApplicationView = "contract" | "phases";

type PayApplicationWorkspaceProps = {
  payItems: QuantityItem[];
  viewMode: PayApplicationView;
  prefillData?: boolean;
};

export function PayApplicationWorkspace({
  payItems,
  viewMode,
  prefillData = true,
}: PayApplicationWorkspaceProps) {
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
  const [newContractItem, setNewContractItem] = useState<NewContractItem>({
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
        next[`purchased-${item.id}`] = prev[`purchased-${item.id}`] ?? 0;
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
    setPhases((prev) => {
      const nextIndex = prev.length + 1;
      const fallbackItems = enrichedPayItems.slice(0, 2).map((item, idx) => ({
        id: `p${nextIndex}-item-${idx}`,
        payItem: item.payItem,
        description: item.description,
        quantity: item.contractQty,
        installedQty: item.installedQty,
      }));
      return [
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
      ];
    });
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
        <PayApplicationContractView
          statusMap={statusMap}
          onToggleStatus={toggleStatus}
          notes={notes}
          onNotesChange={setNotes}
          showContractForm={showContractForm}
          onToggleContractForm={() => setShowContractForm((prev) => !prev)}
          newContractItem={newContractItem}
          onNewContractItemChange={(updates) => setNewContractItem((prev) => ({ ...prev, ...updates }))}
          onAddContractItem={handleAddContractItem}
          onCancelContractItem={() => {
            setShowContractForm(false);
            setNewContractItem({ payItem: "", description: "", contractQty: "", installedQty: "" });
          }}
          contractItems={contractItems}
          stockpileEntries={stockpileEntries}
          stockpileAmounts={stockpileAmounts}
          onStockpilePurchasedChange={(entryId, value) => {
            const normalized = Number.isNaN(value) || value < 0 ? 0 : value;
            setStockpileAmounts((prev) => ({ ...prev, [`purchased-${entryId}`]: normalized }));
          }}
          onStockpileAmountChange={(entryId, value) => {
            const normalized = Number.isNaN(value) || value < 0 ? 0 : value;
            setStockpileAmounts((prev) => ({ ...prev, [entryId]: normalized }));
          }}
          prefillData={prefillData}
        />
      ) : null}
      {viewMode === "phases" ? (
        <PayApplicationPhasesView
          phaseSearch={phaseSearch}
          onPhaseSearchChange={setPhaseSearch}
          phases={phases}
          filteredPhases={filteredPhases}
          onUpdatePhase={updatePhase}
          onTogglePhaseBoolean={togglePhaseBoolean}
          onUpdatePhaseItem={updatePhaseItem}
          onAddPhase={handleAddPhase}
        />
      ) : null}
    </section>
  );
}

export default PayApplicationWorkspace;

