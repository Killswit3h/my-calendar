// src/components/ui/KpiCard.tsx
"use client";

import type { ComponentType } from "react";
import { ArrowDown, ArrowRight, ArrowUp, MapPinned, Timer, ArrowDownRight, ArrowUpRight, Compass, CalendarDays } from "lucide-react";
import { formatNumber } from "@/lib/theme";

export type KpiTrend = "up" | "down" | "neutral";

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  MapPinned,
  Timer,
  ArrowDownRight,
  ArrowUpRight,
  Compass,
  CalendarDays,
};

export type KpiCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  suffix?: string;
  change?: number;
  trend?: KpiTrend;
  iconName?: string;
};

function KpiCard({
  label,
  value,
  hint,
  suffix,
  change,
  trend = "neutral",
  iconName,
}: KpiCardProps) {
  const Icon = iconName ? ICON_MAP[iconName] : undefined;
  
  return (
    <article className="card p-4 flex flex-col gap-3">
      <header className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] token-muted">
        {Icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-card/70 text-[rgb(var(--accent))]">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <span>{label}</span>
      </header>

      <div className="flex flex-col gap-2">
        <span className="text-2xl font-semibold token-fg">
          {typeof value === "number" ? formatNumber(value) : value}
          {suffix ? <span className="ml-1 text-base font-medium token-muted">{suffix}</span> : null}
        </span>

        {typeof change === "number" ? <TrendPill value={change} trend={trend} /> : null}
        {hint ? <p className="text-xs token-muted">{hint}</p> : null}
      </div>
    </article>
  );
}

type TrendPillProps = { value: number; trend: KpiTrend };

function TrendPill({ value, trend }: TrendPillProps) {
  const formatted = `${formatNumber(Math.abs(value))}% vs last period`;
  if (trend === "neutral") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium token-muted">
        <ArrowRight className="h-3 w-3" /> {formatted}
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--accent))]/70">
        <ArrowDown className="h-3 w-3" /> {formatted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--accent))]">
      <ArrowUp className="h-3 w-3" /> {formatted}
    </span>
  );
}

export default KpiCard;
// also provide a named export so existing pages importing { KpiCard } continue to work
export { KpiCard };
