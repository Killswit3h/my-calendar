// src/components/PageHeader.tsx
"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/theme";

type PageHeaderTone = "glass" | "surface";

type Props = {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  auxiliary?: ReactNode;
  className?: string;
  tone?: PageHeaderTone;
};

const toneStyles: Record<PageHeaderTone, string> = {
  glass: "glass text-white border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
  surface: "bg-white text-neutral-900 shadow-sm border border-gray-200",
};

export function PageHeader({ title, description, actions, auxiliary, className, tone = "glass" }: Props) {
  return (
    <header
      className={cn(
        "rounded-2xl px-5 py-5 lg:px-6 lg:py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        toneStyles[tone],
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">{title}</h1>
          {auxiliary ? <div className="flex items-center gap-2">{auxiliary}</div> : null}
        </div>
        {description ? <p className="max-w-3xl text-sm text-white/60">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
