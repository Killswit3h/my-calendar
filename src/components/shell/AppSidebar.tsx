"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    title: "Workspace",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "⊞" },
      { name: "Calendar", href: "/calendar", icon: "📅" },
      { name: "Projects", href: "/projects", icon: "📁" },
      { name: "Documents", href: "/documents", icon: "📄" },
      { name: "Finance", href: "/finance", icon: "⚙️" },
      { name: "Procurement", href: "/procurement", icon: "🎯" },
      { name: "HR", href: "/hr", icon: "☑️" },
      { name: "Fleet", href: "/fleet", icon: "🚛" },
    ],
  },
  {
    title: "Oversight",
    items: [
      { name: "Compliance", href: "/compliance", icon: "👤" },
      { name: "Admin", href: "/admin", icon: "📊" },
    ],
  },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={`sidebar flex h-screen flex-col w-64 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <button className="text-white hover:text-gray-300">
              ←
            </button>
            <div>
              <h1 className="text-white font-bold text-lg">Control Center</h1>
              <p className="text-gray-400 text-sm">Operations Dashboard</p>
            </div>
          </div>
        )}
        {collapsed && (
          <button className="text-white hover:text-gray-300 text-lg">
            ←
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-white font-bold text-sm mb-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive 
                          ? "bg-gray-700 text-white" 
                          : "text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
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
    </aside>
  );
}