"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProjectPayItemView } from "@/app/projects/projects.models";
import { PayApplicationContractView } from "@/components/project/PayApplicationContractView";
import { PayApplicationPhasesView } from "@/components/project/PayApplicationPhasesView";
import { PAY_ITEM_RATES } from "@/components/project/payApplicationConstants";
import type { ChecklistStatus, NewContractItem, Phase, PhaseItem } from "@/components/project/payApplicationTypes";

export type PayApplicationView = "contract" | "phases";

const SUFFIX_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const suffixForIndex = (index: number) => {
  if (index < 0) return "";
  const letters = SUFFIX_LETTERS;
  let n = index;
  let out = "";
  do {
    out = letters[n % 26] + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
};

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
  /** Persisted phase tree; lifted to parent for Save phases */
  phases: Phase[];
  onPhasesChange: (next: Phase[]) => void;
  onSavePhases?: () => void | Promise<void>;
  /** When set, Save phases is disabled and this explains why */
  phasesSaveDisabledReason?: string | null;
  isSavingPhases?: boolean;
  invoiceNumber?: string;
};

type EnrichedPayLine = ProjectPayItemView & { rate: number };

function enrichPayLines(payLines: ProjectPayItemView[]): EnrichedPayLine[] {
  return payLines.map((row) => ({
    ...row,
    rate: PAY_ITEM_RATES[row.payItemNumber] ?? 0,
  }));
}

function isTempPayLineId(id: string): boolean {
  return id.startsWith("temp-");
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
  phases,
  onPhasesChange,
  onSavePhases,
  phasesSaveDisabledReason,
  isSavingPhases = false,
  invoiceNumber = "",
}: PayApplicationWorkspaceProps) {
  const enrichedPayLines = useMemo(() => enrichPayLines(payLines), [payLines]);

  const [phaseSearch, setPhaseSearch] = useState("");

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
    onPhasesChange(phases.map((phase) => (phase.id === phaseId ? { ...phase, ...updates } : phase)));
  };

  const togglePhaseBoolean = (phaseId: string, key: "onsiteReview" | "surveyed") => {
    onPhasesChange(
      phases.map((phase) => (phase.id === phaseId ? { ...phase, [key]: !phase[key] } : phase)),
    );
  };

  const updatePhaseItem = (phaseId: string, itemId: string, updates: Partial<PhaseItem>) => {
    onPhasesChange(
      phases.map((phase) =>
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
    const nextIndex = phases.length + 1;
    const phaseId = `local-phase-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const persistedLines = enrichedPayLines.filter((row) => !isTempPayLineId(row.id));
    const fallbackItems: PhaseItem[] = persistedLines.slice(0, 2).map((item) => {
      const ppi = Number(item.id);
      const stablePpi = Number.isInteger(ppi) && ppi > 0 ? ppi : null;
      return {
        id: `local-line-${phaseId}-${item.id}-${Math.random().toString(36).slice(2, 9)}`,
        projectPayItemId: stablePpi,
        payItem: item.payItemNumber,
        description: item.payItemDescription,
        lineDescription: "",
        contractedQuantity: item.contractedQuantity,
        quantity: item.contractedQuantity,
        installedQty: item.installedQuantity,
      };
    });
    onPhasesChange([
      ...phases,
      {
        id: phaseId,
        name: `Phase ${nextIndex}`,
        invoiceSuffix: suffixForIndex(phases.length),
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

  const handleAddPayItemToPhase = (phaseId: string, projectPayItemId: number) => {
    const row = payLines.find((l) => Number(l.id) === projectPayItemId);
    if (!row || isTempPayLineId(row.id)) return;
    onPhasesChange(
      phases.map((phase) => {
        if (phase.id !== phaseId) return phase;
        if (phase.items.some((it) => it.projectPayItemId === projectPayItemId)) return phase;
        const item: PhaseItem = {
          id: `local-line-${phaseId}-${projectPayItemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          projectPayItemId,
          payItem: row.payItemNumber,
          description: row.payItemDescription,
          lineDescription: "",
          contractedQuantity: row.contractedQuantity,
          quantity: 0,
          installedQty: row.installedQuantity,
        };
        return { ...phase, items: [...phase.items, item] };
      }),
    );
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

  const savePhasesDisabled = Boolean(phasesSaveDisabledReason) || isSavingPhases;

  return (
    <section className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <header className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-white">Pay Application Workspace</h1>
          <p className="truncate text-xs text-white/50">
            Checklist · quantities · stockpile · COs · phases · CSV
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex-shrink-0 rounded-lg bg-[rgba(18,115,24,1)] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Export CSV
        </button>
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
        <div className="mt-2 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/55">
              {phasesSaveDisabledReason
                ? phasesSaveDisabledReason
                : "Save phases stores locate tickets, dates, status, and per-phase quantities. Save Project first if you added new contract lines."}
            </p>
            {onSavePhases ? (
              <button
                type="button"
                disabled={savePhasesDisabled}
                onClick={() => void onSavePhases()}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[rgba(27,_94,_32,_1)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingPhases ? "Saving…" : "Save phases"}
              </button>
            ) : null}
          </div>
          <PayApplicationPhasesView
            phaseSearch={phaseSearch}
            onPhaseSearchChange={setPhaseSearch}
            phases={phases}
            filteredPhases={filteredPhases}
            payLines={payLines}
            onUpdatePhase={updatePhase}
            onTogglePhaseBoolean={togglePhaseBoolean}
            onUpdatePhaseItem={updatePhaseItem}
            onAddPhase={handleAddPhase}
            onAddPayItemToPhase={handleAddPayItemToPhase}
            invoiceNumber={invoiceNumber}
          />
        </div>
      ) : null}
    </section>
  );
}

export default PayApplicationWorkspace;
