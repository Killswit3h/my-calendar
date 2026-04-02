"use client";

import { useEffect, useState } from "react";
import type { ProjectPayItemView } from "@/app/projects/projects.models";
import { PayApplicationContractView } from "@/components/project/PayApplicationContractView";
import { PayApplicationPhasesView } from "@/components/project/PayApplicationPhasesView";
import type { ChecklistStatus, NewContractItem } from "@/components/project/payApplicationTypes";

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

export function PayApplicationWorkspace({
  payLines,
  onUpdatePayLine,
  onAddPayLine,
  onRemovePayLine,
  checklist,
  onToggleChecklist,
  notes,
  onNotesChange,
  viewMode,
}: PayApplicationWorkspaceProps) {
  const [lineSearch, setLineSearch] = useState("");
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
          lineSearch={lineSearch}
          onLineSearchChange={setLineSearch}
          payLines={payLines}
          onUpdateLine={onUpdatePayLine}
          onRemoveLine={onRemovePayLine}
        />
      ) : null}
    </section>
  );
}

export default PayApplicationWorkspace;
