import Link from "next/link";
import { notFound } from "next/navigation";

type ProjectBucket = {
  active: string[];
  backlog: string[];
  done: string[];
};

const mockCompanyProjects: Record<
  string,
  {
    name: string;
    stats: string;
    projects: ProjectBucket;
  }
> = {
  northwind: {
    name: "Northwind Builders",
    stats: "3 active / 6 total",
    projects: {
      active: ["I-75 Noise Wall", "Downtown Streetscape", "Riverwalk Lighting"],
      backlog: ["Airport Canopies", "Seaside Pier Retrofit"],
      done: ["Highline Industrial Park", "Palm River Trail"],
    },
  },
  acme: {
    name: "Acme Civil Group",
    stats: "5 active / 11 total",
    projects: {
      active: ["Central Station Plaza", "US-41 Turn Lanes"],
      backlog: ["Southport Logistics Hub"],
      done: ["Midtown Bridge Rehab", "Cypress Logistics Zone", "Harbor Plaza"],
    },
  },
  lumen: {
    name: "Lumen Infrastructure",
    stats: "2 active / 4 total",
    projects: {
      active: ["Solar Array Phase II", "Battery Yard Expansion"],
      backlog: ["Data Center Fit-out"],
      done: ["EV Corridor Pilot"],
    },
  },
  solstice: {
    name: "Solstice Renewables",
    stats: "4 active / 8 total",
    projects: {
      active: ["Gulf Breeze Wind Farm", "Apalachee Solar 1"],
      backlog: ["Apalachee Solar 2", "Everglades Storage"],
      done: ["Panhandle Solar Retrofit", "Loxahatchee Battery"],
    },
  },
};

const sections: Array<{ label: keyof ProjectBucket; title: string }> = [
  { label: "active", title: "Active" },
  { label: "backlog", title: "Backlog" },
  { label: "done", title: "Done" },
];

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = mockCompanyProjects[id];

  if (!company) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4">
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition hover:text-neutral-100"
          >
            ← Companies
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-neutral-50">{company.name}</h1>
            <p className="text-sm text-neutral-500">{company.stats}</p>
          </div>
          <label className="block">
            <span className="sr-only">Filter projects</span>
            <input
              type="search"
              placeholder="🔎 Filter projects..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-50 placeholder:text-neutral-500 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/5"
            />
          </label>
        </div>

        <div className="space-y-10">
          {sections.map(({ label, title }) => {
            const items = company.projects[label];
            return (
              <section key={label}>
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-neutral-200">{title}</h2>
                </header>
                {items.length === 0 ? (
                  <p className="rounded-2xl border border-neutral-900 bg-neutral-900/40 px-4 py-6 text-sm text-neutral-500">
                    No projects in this bucket yet.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-900/50">
                    {items.map((project) => (
                      <div
                        key={project}
                        className="flex items-center justify-between gap-4 border-b border-neutral-800 px-4 py-4 text-sm text-neutral-100 last:border-b-0"
                      >
                        <p className="font-medium">{project}</p>
                        <div className="flex items-center gap-2">
                          <Link
                            href="#"
                            className="rounded-full border border-neutral-800 px-3 py-1 text-xs font-medium text-neutral-100 transition hover:border-white hover:text-white"
                          >
                            Open
                          </Link>
                          <button
                            type="button"
                            className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 transition hover:border-white/40 hover:text-white"
                            aria-label={`More actions for ${project}`}
                          >
                            ⋯
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
