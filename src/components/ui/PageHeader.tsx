// src/components/PageHeader.tsx
"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/theme";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  auxiliary?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, auxiliary, className }: Props) {
  return (
    <header className={cn("glass px-5 py-5 lg:px-6 lg:py-6 rounded-xl3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", className)}>
      <div className="flex flex-col gap-2">
        {auxiliary}
        <h1 className="text-2xl font-semibold tracking-tight token-fg sm:text-[30px]">{title}</h1>
        {description ? <p className="max-w-3xl text-sm token-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
