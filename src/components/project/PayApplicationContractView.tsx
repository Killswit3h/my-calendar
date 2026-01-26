"use client";

import { cn } from "@/lib/theme";
import type { QuantityItem } from "@/components/project/ProjectQuantitiesCard";
import { CHECKLIST_ITEMS, PAY_ITEM_LABEL } from "@/components/project/payApplicationConstants";
import type {
  ChecklistStatus,
  NewContractItem,
  StockpileEntry,
} from "@/components/project/payApplicationTypes";

type ChangeOrderEntry = {
  id: string;
  payItem: string;
  description: string;
  quantity: number;
  rate: number;
};

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
  contractItems: QuantityItem[];
  stockpileEntries: StockpileEntry[];
  stockpileAmounts: Record<string, number>;
  onStockpilePurchasedChange: (entryId: string, value: number) => void;
  onStockpileAmountChange: (entryId: string, value: number) => void;
  prefillData?: boolean;
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
  contractItems,
  stockpileEntries,
  stockpileAmounts,
  onStockpilePurchasedChange,
  onStockpileAmountChange,
  prefillData = true,
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
            {CHECKLIST_ITEMS.map((item) => (
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
            <p className="text-xs text-white/60">From calendar-installed quantities; completion is installed vs contract.</p>
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
                  placeholder="e.g., 536-8-114"
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
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/60">Installed Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newContractItem.installedQty}
                    onChange={(event) => onNewContractItemChange({ installedQty: event.target.value })}
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
                        onStockpilePurchasedChange(entry.id, value);
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
                            onStockpileAmountChange(entry.id, value);
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
  );
}
