"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

const sections = [
  { title: "Workspace", items: [
    ["Dashboard","/"], ["Calendar","/calendar-fullscreen"], ["Projects","/projects"], ["Todos","/planner/todos"], ["Documents","/documents"], 
    ["Finance","/finance"], ["Finance Jobs","/finance/jobs"], ["Employees","/employees"], ["Inventory","/inventory"],
  ]},
  { title: "Administration", items: [
    ["Admin","/admin"],
  ]},
];

type AppSidebarProps = {
  current?: string;
  className?: string;
  style?: CSSProperties;
  onNavigate?: () => void;
};

export default function AppSidebar({ current = "/", className = "", style, onNavigate }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "72px" : "256px");
  }, [collapsed]);

  const mergedStyle: CSSProperties = { width: "var(--sidebar-w, 256px)", ...style };

  return (
    <aside
      className={`md:sticky md:top-0 h-dvh shrink-0 border-r border-white/10 bg-black/30 backdrop-blur-xl z-30 ${className}`}
      style={mergedStyle}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="btn hidden md:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "»" : "«"}
        </button>
        {!collapsed && <div className="text-lg font-semibold">Control Center</div>}
      </div>

      <nav className="h-[calc(100dvh-56px)] overflow-y-auto px-2 pb-4">
        {sections.map((s) => (
          <div key={s.title} className="mb-4">
            {!collapsed && (
              <div className="mb-2 px-2 text-xs uppercase tracking-wide text-neutral-400">
                {s.title}
              </div>
            )}
            <ul className="space-y-1">
              {s.items.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current === href ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5 ${
                      current === href ? "bg-white/10" : ""
                    }`}
                    title={collapsed ? label : undefined}
                    onClick={() => onNavigate?.()}
                  >
                    <span className="size-2 rounded-full bg-white/30" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!collapsed && (
          <div className="mt-6 px-2 text-xs text-neutral-500">
            © {new Date().getFullYear()} GFC
          </div>
        )}
      </nav>
    </aside>
  );
}
