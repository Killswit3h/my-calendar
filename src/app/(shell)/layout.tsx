"use client";

import { ReactNode } from "react";
import AppSidebar from "@/components/shell/AppSidebar";
import AppTopbar from "@/components/shell/AppTopbar";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[hsl(var(--color-bg))]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar />
        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}