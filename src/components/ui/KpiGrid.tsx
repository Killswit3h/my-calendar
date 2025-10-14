// src/components/ui/KpiGrid.tsx
"use client";

import type { ReactNode } from "react";

export default function KpiGrid({ children }: { children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {children}
    </section>
  );
}
