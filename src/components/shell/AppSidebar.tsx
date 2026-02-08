"use client";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { Menu, X } from "lucide-react";

import { REPORT_ACCESS_AREAS } from "@/lib/accessAreas";

const BASE_SECTIONS = [
  {
    title: "Workspace",
    items: [
      ["Dashboard", "/"],
      ["Calendar", "/calendar-fullscreen"],
      ["Projects", "/projects"],
      ["Reports", "/reports"],
      ["Employees", "/employees"],
    ] as [string, string][],
  },
  {
    title: "Administration",
    items: [["Admin", "/admin"]] as [string, string][],
  },
] as const;

type AppSidebarProps = {
  current?: string;
  className?: string;
  style?: CSSProperties;
  onNavigate?: () => void;
  forceExpanded?: boolean;
  onCollapse?: () => void;
};

export default function AppSidebar({
  current = "/",
  className = "",
  style,
  onNavigate,
  forceExpanded = false,
  onCollapse,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [showReports, setShowReports] = useState(false);
  const isExpanded = forceExpanded || !collapsed;

  useEffect(() => {
    if (forceExpanded) return;
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setCollapsed(saved === "1");
  }, [forceExpanded]);

  useEffect(() => {
    if (forceExpanded) {
      document.documentElement.style.setProperty("--sidebar-w", "256px");
      return;
    }
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "72px" : "256px");
  }, [collapsed, forceExpanded]);

  useEffect(() => {
    let active = true;
    fetch("/api/access/areas")
      .then((res) => res.json())
      .then((payload) => {
        if (!active) return;
        const hasReports = Array.isArray(payload?.areas)
          ? payload.areas.some((area: string) => REPORT_ACCESS_AREAS.some((entry) => entry.key === area))
          : false;
        setShowReports(hasReports);
      })
      .catch(() => setShowReports(false));
    return () => {
      active = false;
    };
  }, []);

  const sections = useMemo(() => {
    return BASE_SECTIONS.map(section => {
      const items = section.items.filter(([label]) => {
        if (label === "Reports") return showReports;
        return true;
      });
      return { ...section, items };
    }).filter(section => section.items.length > 0);
  }, [showReports]);

  const mergedStyle: CSSProperties = {
    width: isExpanded ? "var(--sidebar-w, 256px)" : "auto",
    ...style,
  };
  const chromeClasses = isExpanded
    ? "border-white/10 bg-black/30 backdrop-blur-xl"
    : "border-transparent bg-transparent backdrop-blur-0";

  const handleCollapse = () => {
    if (forceExpanded && onCollapse) {
      onCollapse();
    } else {
      setCollapsed(v => !v);
    }
  };

  return (
    <aside
      className={`md:fixed md:left-0 md:top-0 h-dvh ${chromeClasses} z-30 overflow-hidden transition-[width,transform] duration-300 ease-out ${className}`}
      style={mergedStyle}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={handleCollapse}
          className="btn hidden md:inline-flex items-center justify-center"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
        {isExpanded && <div className="text-lg font-semibold">Control Center</div>}
      </div>

      {isExpanded && (
        <nav className="h-[calc(100dvh-56px)] overflow-y-auto px-2 pb-4 animate-[slideIn_0.3s_ease-out_forwards]">
          {sections.map((s) => (
            <div key={s.title} className="mb-4">
              <div className="mb-2 px-2 text-xs uppercase tracking-wide text-neutral-400">
                {s.title}
              </div>
              <ul className="space-y-1">
                {s.items.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={current === href ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5 ${
                        current === href ? "bg-white/10" : ""
                      }`}
                      onClick={() => onNavigate?.()}
                    >
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-6 px-2 text-xs text-neutral-500">
            © {new Date().getFullYear()} GFC
          </div>
        </nav>
      )}
    </aside>
  );
}
