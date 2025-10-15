import Link from "next/link";

const sections = [
  { title: "Workspace", items: [
    ["Dashboard","/"], ["Calendar","/calendar"], ["Projects","/projects"],
    ["Documents","/documents"], ["Finance","/finance"], ["Inventory","/inventory"],
    ["Procurement","/procurement"], ["HR","/hr"], ["Fleet","/fleet"],
  ]},
  { title: "Oversight", items: [
    ["Compliance","/compliance"], ["Reports","/reports"],
  ]},
  { title: "Administration", items: [
    ["Admin","/admin"],
  ]},
];

export default function AppSidebar({ current = "/" }: { current?: string }) {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 p-4 gap-4">
      <div className="card p-4">
        <div className="text-xl font-semibold">Control Center</div>
        <div className="text-sm text-muted">Operations Dashboard</div>
      </div>
      <nav className="flex-1 space-y-6">
        {sections.map((s) => (
          <div key={s.title}>
            <div className="text-sm uppercase tracking-wide text-muted mb-2">{s.title}</div>
            <ul className="space-y-1">
              {s.items.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current === href ? "page" : undefined}
                    className={`block px-3 py-2 rounded-md hover:bg-white/5 ${
                      current === href ? "bg-white/10" : ""
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="text-xs text-muted">© {new Date().getFullYear()} GFC</div>
    </aside>
  );
}