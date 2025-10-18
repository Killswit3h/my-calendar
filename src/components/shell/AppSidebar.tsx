"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const sections = [
  { title: "Workspace", items: [
    ["Dashboard","/"], ["Calendar","/calendar-fullscreen"], ["Projects","/(shell)/projects"], ["Documents","/(shell)/documents"], 
    ["Finance","/(shell)/finance"], ["Inventory","/(shell)/inventory"], ["Procurement","/(shell)/procurement"], 
    ["HR","/(shell)/hr"], ["Fleet","/(shell)/fleet"],
  ]},
  { title: "Oversight", items: [
    ["Compliance","/(shell)/compliance"], ["Reports","/(shell)/reports"],
  ]},
  { title: "Administration", items: [
    ["Admin","/(shell)/admin"],
  ]},
];

export default function AppSidebar({ current = "/" }: { current?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapsed state and expose CSS var for layout
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "72px" : "256px");
  }, [collapsed]);

  return (
    <aside
      className={`h-dvh sticky top-0 shrink-0 border-r border-white/10 bg-black/30 backdrop-blur-xl z-30`}
      style={{ width: "var(--sidebar-w, 256px)" }}
    >
      <div className="p-3 flex items-center gap-2">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="btn"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "»" : "«"}
        </button>
        {!collapsed && <div className="text-lg font-semibold">Control Center</div>}
      </div>

      <nav className="px-2 pb-4 overflow-y-auto h-[calc(100dvh-56px)]">
        {sections.map((s) => (
          <div key={s.title} className="mb-4">
            {!collapsed && (
              <div className="text-xs uppercase tracking-wide text-neutral-400 px-2 mb-2">
                {s.title}
              </div>
            )}
            <ul className="space-y-1">
              {s.items.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current === href ? "page" : undefined}
                    className={`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/5 ${
                      current === href ? "bg-white/10" : ""
                    }`}
                    title={collapsed ? label : undefined}
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
          <div className="px-2 mt-6 text-xs text-neutral-500">
            © {new Date().getFullYear()} GFC
          </div>
        )}
      </nav>
    </aside>
  );
}