// src/components/ui/ActionQueue.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/theme";
import type { ActionQueueGroup } from "@/lib/dashboard/types";

export default function ActionQueue({ groups }: { groups: ActionQueueGroup[] }) {
  const [activeKey, setActiveKey] = useState(groups[0]?.key ?? "");
  const activeGroup = useMemo(
    () => groups.find((g) => g.key === activeKey) ?? groups[0],
    [groups, activeKey]
  );

  if (!groups.length) return null;

  return (
    <section className="glass rounded-xl3 shadow-card">
      <header className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] token-fg">
            Action Queue
          </h2>
          <p className="text-sm token-muted">
            Approvals, RFIs, and expiring items from across modules.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => {
            const active = activeGroup?.key === group.key;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => setActiveKey(group.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition",
                  active
                    ? "border-[rgb(var(--accent))]/70 text-[rgb(var(--accent))]"
                    : "border-white/10 token-muted hover:text-[rgb(var(--accent))]"
                )}
              >
                {group.label}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    active
                      ? "bg-[rgb(var(--accent))]/15 text-[rgb(var(--accent))]"
                      : "bg-card/40 token-muted"
                  )}
                >
                  {group.items.length}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <ul className="divide-y divide-white/10">
        {activeGroup?.items.length ? (
          activeGroup.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 px-6 py-4 transition hover:bg-[rgb(var(--accent))]/5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <Link
                  href={item.href}
                  className="text-sm font-semibold token-fg hover:underline"
                >
                  {item.title}
                </Link>
                {item.description ? (
                  <p className="text-sm token-muted">{item.description}</p>
                ) : null}
                {item.meta ? (
                  <p className="text-xs token-muted">{item.meta}</p>
                ) : null}
              </div>
              {item.due ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-medium token-muted">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {new Date(item.due).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              ) : null}
            </li>
          ))
        ) : (
          <li className="px-6 py-12 text-center text-sm token-muted">
            Nothing queued—enjoy the clear runway.
          </li>
        )}
      </ul>
    </section>
  );
}
