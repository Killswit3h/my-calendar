"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    title: "Workspace",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "📊" },
      { name: "Calendar", href: "/calendar", icon: "📅" },
      { name: "Projects", href: "/projects", icon: "📁" },
      { name: "Documents", href: "/documents", icon: "📄" },
      { name: "Finance", href: "/finance", icon: "💰" },
      { name: "Inventory", href: "/inventory", icon: "📦" },
      { name: "Procurement", href: "/procurement", icon: "🛒" },
      { name: "HR", href: "/hr", icon: "👥" },
      { name: "Fleet", href: "/fleet", icon: "🚛" },
    ],
  },
  {
    title: "Oversight",
    items: [
      { name: "Compliance", href: "/compliance", icon: "🛡️" },
      { name: "Reports", href: "/reports", icon: "📈" },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Admin", href: "/admin", icon: "⚙️" },
    ],
  },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={`flex h-screen flex-col border-r border-black/10 bg-white/50 backdrop-blur-xl transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--color-accent))] flex items-center justify-center">
              <span className="text-black font-bold text-sm">GFC</span>
            </div>
            <div>
              <h1 className="font-semibold text-[hsl(var(--color-fg))]">Control Center</h1>
              <p className="text-xs text-neutral-500">Operations Dashboard</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-black/5 transition-colors"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 ${
                        isActive ? "bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))] border-r-2 border-[hsl(var(--color-accent))]" : ""
                      } ${collapsed ? "justify-center" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="text-base">{item.icon}</span>
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-black/10">
          <div className="text-xs text-neutral-500">
            <p>Version 2.0.0</p>
            <p>© 2024 GFC</p>
          </div>
        </div>
      )}
    </aside>
  );
}