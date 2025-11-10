import Link from "next/link";

const mockCompanies = [
  { id: "northwind", name: "Northwind Builders", activeProjects: 3 },
  { id: "acme", name: "Acme Civil Group", activeProjects: 5 },
  { id: "lumen", name: "Lumen Infrastructure", activeProjects: 2 },
  { id: "solstice", name: "Solstice Renewables", activeProjects: 4 },
];

export default function CompaniesPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Planner</p>
          <h1 className="text-3xl font-semibold">Companies</h1>
          <p className="text-sm text-neutral-400">
            Pick a company to drill into its current, upcoming, and completed projects.
          </p>
          <label className="block">
            <span className="sr-only">Search companies</span>
            <input
              type="search"
              placeholder="🔎 Search companies..."
              className="mt-3 w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-50 placeholder:text-neutral-500 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/5"
            />
          </label>
        </header>

        <ul className="space-y-4">
          {mockCompanies.map((company) => (
            <li
              key={company.id}
              className="rounded-2xl border border-neutral-900 bg-neutral-900/60 p-4 transition hover:border-neutral-700 hover:bg-neutral-900"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-50">{company.name}</h2>
                  <p className="text-sm text-neutral-500">{company.activeProjects} active projects</p>
                </div>
                <Link
                  href={`/companies/${company.id}`}
                  className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:border-white hover:text-white"
                >
                  View ▸
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
