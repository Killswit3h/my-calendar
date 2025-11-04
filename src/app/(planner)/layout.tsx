// app/(planner)/layout.tsx
import "../globals.css";
import type { ReactNode } from "react";

export default function PlannerShell({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="dark h-full"
      suppressHydrationWarning
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-screen min-h-[100svh] bg-zinc-950 text-zinc-100 antialiased">
        <div className="safe-p">{children}</div>
      </body>
    </html>
  );
}
