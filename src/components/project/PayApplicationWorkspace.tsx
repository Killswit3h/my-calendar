"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProjectPayItemView } from "@/app/projects/projects.models";
import { PayApplicationContractView } from "@/components/project/PayApplicationContractView";
import { PayApplicationPhasesView } from "@/components/project/PayApplicationPhasesView";
import { PAY_ITEM_RATES } from "@/components/project/payApplicationConstants";
import type { ChecklistStatus, NewContractItem, Phase, PhaseItem } from "@/components/project/payApplicationTypes";

export type PayApplicationView = "contract" | "phases";

type PayApplicationWorkspaceProps = {
  payLines: ProjectPayItemView[];
  onUpdatePayLine: (id: string, updates: Partial<ProjectPayItemView>) => void;
  onAddPayLine: (draft: {
    payItemNumber: string;
    description: string;
    contractQty: number;
  }) => void;
  onRemovePayLine: (id: string) => void;
  checklist: Record<string, ChecklistStatus>;
  onToggleChecklist: (key: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  viewMode: PayApplicationView;
};

type EnrichedPayLine = ProjectPayItemView & { rate: number };

function enrichPayLines(payLines: ProjectPayItemView[]): EnrichedPayLine[] {
  return payLines.map((row) => ({
    ...row,
    rate: PAY_ITEM_RATES[row.payItemNumber] ?? 0,
  }))
}

/** Phases tab: legacy UI seeded from contract pay lines (local state; not persisted separately). */
function buildInitialPhases(items: EnrichedPayLine[]): Phase[] {
  if (!items.length) {
    return [
      {
        id: "phase-1",
        name: "Phase 1",
        locateTicket: "",
        dateCreated: "",
        readyToWorkDate: "",
        onsiteReview: false,
        surveyed: false,
        status: "Pending",
        statusDate: "",
        notes: "",
        items: [],
      },
      {
        id: "phase-2",
        name: "Phase 2",
        locateTicket: "",
        dateCreated: "",
        readyToWorkDate: "",
        onsiteReview: false,
        surveyed: false,
        status: "Pending",
        statusDate: "",
        notes: "",
        items: [],
      },
    ]
  }

  const baseItems = items.slice(0, 2)
  const extraItems = items.slice(2, 4)

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
        id: `p1-${item.id}-${idx}`,
        payItem: item.payItemNumber,
        description: item.payItemDescription,
        quantity: item.contractedQuantity,
        installedQty: item.installedQuantity,
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
            id: `p2-${item.id}-${idx}`,
            payItem: item.payItemNumber,
            description: item.payItemDescription,
            quantity: item.contractedQuantity,
            installedQty: item.installedQuantity,
          }))
        : baseItems.map((item, idx) => ({
            id: `p2-fallback-${item.id}-${idx}`,
            payItem: item.payItemNumber,
            description: item.payItemDescription,
            quantity: Math.round(item.contractedQuantity / 2),
            installedQty: Math.round(item.installedQuantity / 2),
          })),
    },
  ]
}

export function PayApplicationWorkspace({
  payLines,
  onUpdatePayLine,
  onAddPayLine,
  onRemovePayLine: _onRemovePayLine,
  checklist,
  onToggleChecklist,
  notes,
  onNotesChange,
  viewMode,
}: PayApplicationWorkspaceProps) {
  const enrichedPayLines = useMemo(() => enrichPayLines(payLines), [payLines])

  const [phaseSearch, setPhaseSearch] = useState("")
  const [phases, setPhases] = useState<Phase[]>(() => buildInitialPhases(enrichPayLines(payLines)))

  useEffect(() => {
    setPhases(buildInitialPhases(enrichedPayLines))
  }, [enrichedPayLines])

  const [showContractForm, setShowContractForm] = useState(false);
  const [newContractItem, setNewContractItem] = useState<NewContractItem>({
    payItem: "",
    description: "",
    contractQty: "",
    installedQty: "",
  });
  const [stockpilePurchasedByLineId, setStockpilePurchasedByLineId] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    setStockpilePurchasedByLineId((prev) => {
      const next: Record<string, number> = {};
      for (const row of payLines) {
        next[row.id] = prev[row.id] ?? 0;
      }
      return next;
    });
  }, [payLines]);

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

  const handleAddPhase = () => {
    setPhases((prev) => {
      const nextIndex = prev.length + 1;
      const fallbackItems = enrichedPayLines.slice(0, 2).map((item, idx) => ({
        id: `p${nextIndex}-item-${item.id}-${idx}`,
        payItem: item.payItemNumber,
        description: item.payItemDescription,
        quantity: item.contractedQuantity,
        installedQty: item.installedQuantity,
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

  const handleAddContractItem = (event: React.FormEvent) => {
    event.preventDefault();
    const contractQty = Number(newContractItem.contractQty);
    if (!newContractItem.payItem.trim() || Number.isNaN(contractQty) || contractQty < 0) return;
    onAddPayLine({
      payItemNumber: newContractItem.payItem.trim(),
      description: newContractItem.description.trim() || "Added pay item",
      contractQty,
    });
    setNewContractItem({ payItem: "", description: "", contractQty: "", installedQty: "" });
    setShowContractForm(false);
  };

  const handleExport = () => {
    window?.alert?.("Pay application CSV export placeholder (frontend-only).");
  };

  return (
    <section className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/60">Projects / Pay Application Workspace</p>
          <h1 className="text-2xl font-semibold text-white">Pay Application Workspace</h1>
          <p className="text-sm text-white/60">Checklist, quantities, stockpile, phases, and CSV export.</p>
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
          statusMap={checklist}
          onToggleStatus={onToggleChecklist}
          notes={notes}
          onNotesChange={onNotesChange}
          showContractForm={showContractForm}
          onToggleContractForm={() => setShowContractForm((prev) => !prev)}
          newContractItem={newContractItem}
          onNewContractItemChange={(updates) => setNewContractItem((prev) => ({ ...prev, ...updates }))}
          onAddContractItem={handleAddContractItem}
          onCancelContractItem={() => {
            setShowContractForm(false);
            setNewContractItem({ payItem: "", description: "", contractQty: "", installedQty: "" });
          }}
          payLines={payLines}
          onUpdatePayLine={onUpdatePayLine}
          stockpilePurchasedByLineId={stockpilePurchasedByLineId}
          onStockpilePurchasedChange={(lineId, value) => {
            setStockpilePurchasedByLineId((prev) => ({ ...prev, [lineId]: value }));
          }}
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
