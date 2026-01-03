"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/theme";

export type QuantityItem = {
  id: string;
  payItem: string;
  description: string;
  contractQty: number;
  installedQty: number;
};

type Props = {
  initialItems: QuantityItem[];
};

export function ProjectQuantitiesCard({ initialItems }: Props) {
  const [items, setItems] = useState<QuantityItem[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(initialItems[0]?.id ?? "");
  const [additionalQty, setAdditionalQty] = useState("");
  const [entryDate, setEntryDate] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const qty = Number(additionalQty);
    if (!selectedItem || Number.isNaN(qty) || qty <= 0) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem
          ? { ...item, installedQty: Math.min(item.contractQty, item.installedQty + qty) }
          : item,
      ),
    );
    setAdditionalQty("");
    setEntryDate("");
    setShowForm(false);
  };

  const options = useMemo(
    () =>
      items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.payItem} — {item.description}
        </option>
      )),
    [items],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-white">Quantities Completed</h2>
        <p className="text-sm text-white/60">Track installed quantities vs. contract.</p>
      </header>

      <div className="space-y-4">
        <div className="hidden text-xs text-white/60 lg:grid lg:grid-cols-[1fr,2fr,120px,120px] lg:gap-3">
          <span>Pay Item</span>
          <span>Description</span>
          <span className="text-right">Contract</span>
          <span className="text-right">Installed</span>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm shadow-inner lg:grid lg:grid-cols-[1fr,2fr,120px,120px] lg:items-center lg:gap-3"
            >
              <div className="font-semibold text-white">{item.payItem}</div>
              <div className="text-white/70">{item.description}</div>
              <div className="mt-2 text-white/70 lg:mt-0 lg:text-right">{item.contractQty.toLocaleString()}</div>
              <div className="text-white lg:text-right">{item.installedQty.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/60">Pay Item</label>
              <select
                value={selectedItem}
                onChange={(event) => setSelectedItem(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              >
                {options}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/60">Additional Installed Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={additionalQty}
                onChange={(event) => setAdditionalQty(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                placeholder="e.g., 120"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/60">Date</label>
              <input
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
              >
                Save Entry
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            Add Quantity Entry
          </button>
        )}
      </div>
    </section>
  );
}

