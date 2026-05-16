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

function currency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Compact card header used across the Pay Application workspace. */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-white">{title}</p>
      {subtitle ? <p className="truncate text-[11px] text-white/40">{subtitle}</p> : null}
    </div>
  );
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
      <div className="grid gap-2 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <SectionTitle title="Procedure Check List" subtitle="Pre-mobilization status" />
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {CHECKLIST_ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
              >
                <span className="truncate text-xs font-medium text-white/90">{item.label}</span>
                <button
                  type="button"
                  onClick={() => onToggleStatus(item.key)}
                  className={cn(
                    "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                    STATUS_CLASS[statusMap[item.key]],
                  )}
                >
                  {STATUS_LABEL[statusMap[item.key]]}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <SectionTitle title="Notes" subtitle="Pay-application memo" />
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="Stockpile deductions, phase readiness, CO refs…"
            className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
          />
        </div>
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <SectionTitle title="Contract Quantities" subtitle="Installed vs. contract from calendar entries" />
            <button
              type="button"
              onClick={onToggleContractForm}
              className="flex-shrink-0 rounded-md border border-white/20 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              {showContractForm ? "Close" : "+ Pay Item"}
            </button>
          </div>
          {showContractForm ? (
            <form onSubmit={onAddContractItem} className="mb-2 grid grid-cols-2 gap-1.5 rounded-lg border border-white/15 bg-black/25 p-2">
              <input
                value={newContractItem.payItem}
                onChange={(event) => onNewContractItemChange({ payItem: event.target.value })}
                className="col-span-2 min-w-0 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 sm:col-span-1"
                placeholder={PAY_ITEM_LABEL}
                required
              />
              <input
                value={newContractItem.description}
                onChange={(event) => onNewContractItemChange({ description: event.target.value })}
                className="col-span-2 min-w-0 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 sm:col-span-1"
                placeholder="Description"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={newContractItem.contractQty}
                onChange={(event) => onNewContractItemChange({ contractQty: event.target.value })}
                className="min-w-0 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                placeholder="Contract"
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={newContractItem.installedQty}
                onChange={(event) => onNewContractItemChange({ installedQty: event.target.value })}
                className="min-w-0 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                placeholder="Installed"
              />
              <div className="col-span-2 flex justify-end gap-1">
                <button
                  type="button"
                  onClick={onCancelContractItem}
                  className="rounded-md border border-white/20 px-3 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[rgba(18,115,24,1)] px-3 py-1 text-[11px] font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Save
                </button>
              </div>
            </form>
          ) : null}
          <div className="grid grid-cols-[78px_1fr_44px_44px_120px_44px] items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            <span>Code</span>
            <span>Description</span>
            <span className="text-right">Bud</span>
            <span className="text-right">Act</span>
            <span className="pl-1">Progress</span>
            <span className="text-right">%</span>
          </div>
          <div className="space-y-1.5">
            {contractItems.map((item) => {
              const pct = item.contractQty ? Math.min(100, (item.installedQty / item.contractQty) * 100) : 0;
              const tone = pct >= 100
                ? { bar: "bg-emerald-400", text: "text-emerald-300" }
                : pct >= 50
                  ? { bar: "bg-amber-400", text: "text-amber-300" }
                  : { bar: "bg-white/30", text: "text-white/50" };
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[78px_1fr_44px_44px_120px_44px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition hover:bg-white/[0.07]"
                >
                  <div className="min-w-0 font-mono text-[11px] font-semibold tracking-tight text-white">{item.payItem}</div>
                  <div className="min-w-0 truncate text-[13px] text-white/85" title={item.description}>{item.description}</div>
                  <div className="text-right tabular-nums text-white/45">{item.contractQty.toLocaleString()}</div>
                  <div className="text-right text-[15px] font-semibold tabular-nums text-white">{item.installedQty.toLocaleString()}</div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={cn("h-full rounded-full transition-all duration-300", tone.bar)}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${item.description} progress`}
                    />
                  </div>
                  <div className={cn("text-right text-[13px] font-bold tabular-nums", tone.text)}>
                    {pct.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <SectionTitle title="Stockpile" subtitle="Stockpiled qty + unit-rate deductions" />
          <div className="mt-2 grid grid-cols-[1fr_1.3fr_0.65fr_0.7fr_1.2fr] gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            <span>{PAY_ITEM_LABEL}</span>
            <span>Description</span>
            <span className="text-center">Contract</span>
            <span className="text-center">Purchased</span>
            <span className="text-center">Rate / Deduction</span>
          </div>
          <div className="space-y-1.5">
            {stockpileEntries.map((entry) => {
              const amount = stockpileAmounts[entry.id] ?? 0;
              const rate = entry.quantity ? amount / entry.quantity : 0;

              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-[1fr_1.3fr_0.65fr_0.7fr_1.2fr] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition hover:bg-white/[0.07]"
                >
                  <div className="min-w-0 font-mono text-[11px] font-semibold tracking-tight text-white">{entry.payItem}</div>
                  <div className="min-w-0 truncate text-[13px] text-white/85" title={entry.description}>{entry.description}</div>
                  <div className="text-center tabular-nums text-white/45">{entry.quantity.toLocaleString()}</div>
                  <div className="flex justify-center">
                    <label className="sr-only" htmlFor={`stockpile-purchased-${entry.id}`}>
                      Purchased quantity for {entry.payItem}
                    </label>
                    <input
                      id={`stockpile-purchased-${entry.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={(stockpileAmounts[`purchased-${entry.id}`] ?? 0).toString()}
                      onChange={(event) => onStockpilePurchasedChange(entry.id, Number(event.target.value))}
                      className="h-7 w-16 rounded-full border border-white/15 bg-black/30 px-2 text-center text-[12px] tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      placeholder="0"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <label className="sr-only" htmlFor={`stockpile-amount-${entry.id}`}>
                      Stockpile amount for {entry.payItem}
                    </label>
                    <span className="text-[11px] text-white/45">$</span>
                    <input
                      id={`stockpile-amount-${entry.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(event) => onStockpileAmountChange(entry.id, Number(event.target.value))}
                      className="h-7 w-20 rounded-full border border-white/15 bg-black/30 px-2 text-center text-[12px] tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      placeholder="0.00"
                      inputMode="decimal"
                    />
                    <span className="text-[11px] tabular-nums text-white/45">{entry.quantity ? currency(rate) : "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3 lg:col-span-2">
          <SectionTitle title="Change Orders" subtitle="Separate CO pay items + quantities" />
          <div className="mt-2 grid grid-cols-[1fr_2fr_0.6fr_0.8fr_0.9fr] gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            <span>{PAY_ITEM_LABEL}</span>
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="space-y-1.5">
            {prefillData && CHANGE_ORDERS.length > 0 ? (
              CHANGE_ORDERS.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[1fr_2fr_0.6fr_0.8fr_0.9fr] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition hover:bg-white/[0.07]"
                >
                  <div className="min-w-0 font-mono text-[11px] font-semibold tracking-tight text-white">{entry.payItem}</div>
                  <div className="min-w-0 truncate text-[13px] text-white/85" title={entry.description}>{entry.description}</div>
                  <div className="text-right tabular-nums text-white/45">{entry.quantity.toLocaleString()}</div>
                  <div className="text-right tabular-nums text-white/55">{currency(entry.rate)}</div>
                  <div className="text-right text-[15px] font-semibold tabular-nums text-white">{currency(entry.quantity * entry.rate)}</div>
                </div>
              ))
            ) : (
              <div className="rounded-full border border-dashed border-white/15 bg-black/20 px-4 py-2 text-xs text-white/50">
                No change orders added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
