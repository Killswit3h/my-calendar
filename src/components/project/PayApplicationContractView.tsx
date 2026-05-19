"use client";

import type { ProjectPayItemView } from "@/app/projects/projects.models";
import { cn } from "@/lib/theme";
import {
  CHECKLIST_ITEMS,
  PAY_ITEM_LABEL,
} from "@/components/project/payApplicationConstants";
import type {
  ChecklistStatus,
  NewContractItem,
} from "@/components/project/payApplicationTypes";


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

function currency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function progressTone(percent: number) {
  if (percent >= 100)
    return { bar: "bg-emerald-400", text: "text-emerald-300" };
  if (percent >= 50) return { bar: "bg-amber-400", text: "text-amber-300" };
  return { bar: "bg-white/30", text: "text-white/50" };
}

/** Compact card header used across the Pay Application workspace. */
function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-white">
        {title}
      </p>
      {subtitle ? (
        <p className="truncate text-[11px] text-white/40">{subtitle}</p>
      ) : null}
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
      <div className="grid gap-2 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <SectionTitle
            title="Procedure Check List"
            subtitle="Pre-mobilization status"
          />
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {CHECKLIST_ITEMS.map((item) => {
              const st = statusMap[item.key] ?? "NOT_STARTED";
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
                >
                  <span className="truncate text-xs font-medium text-white/90">
                    {item.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(item.key)}
                    className={cn(
                      "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
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

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <SectionTitle title="Notes" subtitle="Pay-application memo" />
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="Stockpile deductions, phase readiness, CO refs..."
            className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
          />
        </div>
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <SectionTitle
              title="Contract Quantities"
              subtitle="Installed vs. contract from calendar entries"
            />
            <button
              type="button"
              onClick={onToggleContractForm}
              className="flex-shrink-0 rounded-md border border-white/20 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              {showContractForm ? "Close" : "+ Pay Item"}
            </button>
          </div>
          {showContractForm ? (
            <form
              onSubmit={onAddContractItem}
              className="mb-2 grid grid-cols-2 gap-1.5 rounded-lg border border-white/15 bg-black/25 p-2"
            >
              <input
                value={newContractItem.payItem}
                onChange={(event) =>
                  onNewContractItemChange({ payItem: event.target.value })
                }
                className="col-span-2 min-w-0 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 sm:col-span-1"
                placeholder={PAY_ITEM_LABEL}
                required
              />
              <input
                value={newContractItem.description}
                onChange={(event) =>
                  onNewContractItemChange({ description: event.target.value })
                }
                className="col-span-2 min-w-0 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 sm:col-span-1"
                placeholder="Description"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={newContractItem.contractQty}
                onChange={(event) =>
                  onNewContractItemChange({ contractQty: event.target.value })
                }
                className="min-w-0 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                placeholder="Contract"
                required
              />
              <div className="col-span-2 flex justify-end gap-1 sm:col-span-1">
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
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[78px_1fr_58px_44px_120px_44px] items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                <span>Code</span>
                <span>Description</span>
                <span className="text-right">Bud</span>
                <span className="text-right">Act</span>
                <span className="pl-1">Progress</span>
                <span className="text-right">%</span>
              </div>
              <div className="space-y-1.5">
                {payLines.map((row) => {
                  const pct = row.contractedQuantity
                    ? Math.min(
                        100,
                        (row.installedQuantity / row.contractedQuantity) * 100,
                      )
                    : 0;
                  const tone = progressTone(pct);
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[78px_1fr_58px_44px_120px_44px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition hover:bg-white/[0.07]"
                    >
                      <div className="min-w-0 font-mono text-[11px] font-semibold tracking-tight text-white">
                        {row.payItemNumber}
                      </div>
                      <div
                        className="min-w-0 truncate text-[13px] text-white/85"
                        title={row.payItemDescription}
                      >
                        {row.payItemDescription}
                      </div>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.contractedQuantity}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          onUpdatePayLine(row.id, {
                            contractedQuantity:
                              Number.isNaN(value) || value < 0 ? 0 : value,
                          });
                        }}
                        aria-label={`Contract quantity for ${row.payItemNumber}`}
                        className="h-7 rounded-full border border-white/15 bg-black/30 px-2 text-right text-[12px] tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      />
                      <div className="text-right text-[15px] font-semibold tabular-nums text-white">
                        {row.installedQuantity.toLocaleString()}
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            tone.bar,
                          )}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${row.payItemDescription} progress`}
                        />
                      </div>
                      <div
                        className={cn(
                          "text-right text-[13px] font-bold tabular-nums",
                          tone.text,
                        )}
                      >
                        {pct.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <SectionTitle
            title="Stockpile"
            subtitle="Stockpiled qty + unit-rate deductions"
          />
          <div className="mt-2 overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[1fr_1.3fr_0.65fr_0.7fr_1.2fr] gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                <span>{PAY_ITEM_LABEL}</span>
                <span>Description</span>
                <span className="text-center">Contract</span>
                <span className="text-center">Purchased</span>
                <span className="text-center">Rate / Deduction</span>
              </div>
              <div className="space-y-1.5">
                {payLines.map((row) => {
                  const amount = row.stockpileBilled ?? 0;
                  const qty = row.contractedQuantity;
                  const rate = qty ? amount / qty : 0;
                  const purchased = stockpilePurchasedByLineId[row.id] ?? 0;

                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[1fr_1.3fr_0.65fr_0.7fr_1.2fr] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition hover:bg-white/[0.07]"
                    >
                      <div className="min-w-0 font-mono text-[11px] font-semibold tracking-tight text-white">
                        {row.payItemNumber}
                      </div>
                      <div
                        className="min-w-0 truncate text-[13px] text-white/85"
                        title={row.payItemDescription}
                      >
                        {row.payItemDescription}
                      </div>
                      <div className="text-center tabular-nums text-white/45">
                        {qty.toLocaleString()}
                      </div>
                      <div className="flex justify-center">
                        <label
                          className="sr-only"
                          htmlFor={`stockpile-purchased-${row.id}`}
                        >
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
                            onStockpilePurchasedChange(
                              row.id,
                              Number.isNaN(value) || value < 0 ? 0 : value,
                            );
                          }}
                          className="h-7 w-16 rounded-full border border-white/15 bg-black/30 px-2 text-center text-[12px] tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                          placeholder="0"
                          inputMode="decimal"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <label
                          className="sr-only"
                          htmlFor={`stockpile-amount-${row.id}`}
                        >
                          Stockpile amount for {row.payItemNumber}
                        </label>
                        <span className="text-[11px] text-white/45">$</span>
                        <input
                          id={`stockpile-amount-${row.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            onUpdatePayLine(row.id, {
                              stockpileBilled:
                                Number.isNaN(value) || value < 0 ? 0 : value,
                            });
                          }}
                          className="h-7 w-20 rounded-full border border-white/15 bg-black/30 px-2 text-center text-[12px] tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                          placeholder="0.00"
                          inputMode="decimal"
                        />
                        <span className="text-[11px] tabular-nums text-white/45">
                          {qty ? currency(rate) : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3 lg:col-span-2">
          <SectionTitle
            title="Change Orders"
            subtitle="Separate CO pay items + quantities"
          />
          <p className="mt-3 rounded-lg border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/55">
            Change orders aren&apos;t connected to data yet — nothing to show here.
          </p>
        </div>
      </div>
    </>
  );
}
