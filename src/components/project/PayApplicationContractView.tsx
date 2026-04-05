"use client";

import type { ProjectPayItemView } from "@/app/projects/projects.models";
import { cn } from "@/lib/theme";
import { CHECKLIST_ITEMS, PAY_ITEM_LABEL } from "@/components/project/payApplicationConstants";
import type { ChecklistStatus, NewContractItem } from "@/components/project/payApplicationTypes";

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

function percent(installed: number, contract: number) {
  if (!contract) return "0%";
  const value = Math.min(100, (installed / contract) * 100);
  return `${value.toFixed(1)}%`;
}

function currency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type ContractViewProps = {
  statusMap: Record<string, ChecklistStatus>;
  onToggleStatus: (key: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  showContractForm: boolean;
  onToggleContractForm: () => void;
  newContractItem: NewContractItem;
  onNewContractItemChange: (updates: Partial<NewContractItem>) => void;
  onAddContractItem: (event: React.FormEvent) => void;
  onCancelContractItem: () => void;
  payLines: ProjectPayItemView[];
  onUpdatePayLine: (id: string, updates: Partial<ProjectPayItemView>) => void;
  stockpilePurchasedByLineId: Record<string, number>;
  onStockpilePurchasedChange: (lineId: string, value: number) => void;
};

export function PayApplicationContractView({
  statusMap,
  onToggleStatus,
  notes,
  onNotesChange,
  showContractForm,
  onToggleContractForm,
  newContractItem,
  onNewContractItemChange,
  onAddContractItem,
  onCancelContractItem,
  payLines,
  onUpdatePayLine,
  stockpilePurchasedByLineId,
  onStockpilePurchasedChange,
}: ContractViewProps) {
  return (
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
            {CHECKLIST_ITEMS.map((item) => {
              const st = statusMap[item.key] ?? "NOT_STARTED";
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-white/90">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(item.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                      STATUS_CLASS[st],
                    )}
                  >
                    {STATUS_LABEL[st]}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Notes / Other Information</p>
              <p className="text-xs text-white/60">Saved with the project when you click Save Project.</p>
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
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
            <p className="text-xs text-white/60">
              Installed totals come from the calendar. Use Save Project to persist edits.
            </p>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggleContractForm}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              {showContractForm ? "Close" : "Add Pay Item"}
            </button>
          </div>
          {showContractForm ? (
            <form onSubmit={onAddContractItem} className="mb-4 space-y-3 rounded-xl border border-white/15 bg-black/25 p-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/60">{PAY_ITEM_LABEL}</label>
                <input
                  value={newContractItem.payItem}
                  onChange={(event) => onNewContractItemChange({ payItem: event.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  placeholder="e.g., 536-8-114 (must exist in pay item catalog)"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/60">Description</label>
                <input
                  value={newContractItem.description}
                  onChange={(event) => onNewContractItemChange({ description: event.target.value })}
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
                    onChange={(event) => onNewContractItemChange({ contractQty: event.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                >
                  Add line
                </button>
                <button
                  type="button"
                  onClick={onCancelContractItem}
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
            {payLines.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm md:grid md:grid-cols-[1fr,1.6fr,0.8fr,0.8fr,0.7fr] md:items-center md:gap-2"
              >
                <div className="font-semibold text-white">{row.payItemNumber}</div>
                <div className="text-white/70">{row.payItemDescription}</div>
                <div className="mt-2 md:mt-0 md:text-right">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.contractedQuantity}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      onUpdatePayLine(row.id, {
                        contractedQuantity: Number.isNaN(v) || v < 0 ? 0 : v,
                      });
                    }}
                    className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 text-right text-white md:max-w-[6rem]"
                  />
                </div>
                <div className="text-white md:text-right">{row.installedQuantity.toLocaleString()}</div>
                <div className="mt-2 text-right text-white/80 md:mt-0">
                  {percent(row.installedQuantity, row.contractedQuantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-white">Stockpile</p>
            <p className="text-xs text-white/60">
              Dollar amount is saved as stockpile billed. Purchased qty is for reference only on this page.
            </p>
          </div>
          <div className="hidden text-xs text-white/60 md:grid md:grid-cols-[1fr,1.3fr,0.65fr,0.65fr,1.4fr] md:gap-2">
            <span>{PAY_ITEM_LABEL}</span>
            <span>Description</span>
            <span className="text-center">Contract Qty</span>
            <span className="text-right">Purchased Qty</span>
            <span className="text-center">Rate / Deduction</span>
          </div>
          <div className="mt-2 space-y-3">
            {payLines.map((row) => {
              const amount = row.stockpileBilled ?? 0;
              const qty = row.contractedQuantity;
              const rate = qty ? amount / qty : 0;
              const purchased = stockpilePurchasedByLineId[row.id] ?? 0;

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm md:grid md:grid-cols-[1fr,1.3fr,0.65fr,0.65fr,1.4fr] md:items-center md:gap-2"
                >
                  <div className="font-semibold text-white">{row.payItemNumber}</div>
                  <div className="text-white/70">{row.payItemDescription}</div>
                  <div className="mt-2 text-white/70 md:mt-0 md:text-center">{qty.toLocaleString()}</div>
                  <div className="mt-2 text-white/70 md:mt-0 md:text-center md:flex md:justify-center">
                    <label className="sr-only" htmlFor={`stockpile-purchased-${row.id}`}>
                      Purchased quantity for {row.payItemNumber}
                    </label>
                    <input
                      id={`stockpile-purchased-${row.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchased.toString()}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        onStockpilePurchasedChange(row.id, Number.isNaN(value) || value < 0 ? 0 : value);
                      }}
                      className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 md:w-24"
                      placeholder="0.00"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="mt-2 text-white md:mt-0 md:text-center">
                    <div className="flex flex-col items-center gap-1">
                      <label className="sr-only" htmlFor={`stockpile-amount-${row.id}`}>
                        Stockpile amount for {row.payItemNumber}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/70">$</span>
                        <input
                          id={`stockpile-amount-${row.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            onUpdatePayLine(row.id, {
                              stockpileBilled: Number.isNaN(value) || value < 0 ? 0 : value,
                            });
                          }}
                          className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 md:w-32"
                          placeholder="0.00"
                          inputMode="decimal"
                        />
                        <div className="text-xs text-white/60">Rate {qty ? currency(rate) : "—"}</div>
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
            <p className="text-xs text-white/60">Not wired to the database in this release.</p>
          </div>
          <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-3 text-sm text-white/60">
            Change order tracking is out of scope for the current pay workspace save flow.
          </div>
        </div>
      </div>
    </>
  );
}
