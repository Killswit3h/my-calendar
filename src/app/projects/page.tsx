import Link from "next/link";
import { ArrowUpRight, KanbanSquare, ListFilter, PanelsTopLeft, Sparkles, Users2 } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { NewProjectLauncher } from "./NewProjectLauncher";
import { COMPANIES, PROJECTS } from "@/lib/mock/projects";
import { cn } from "@/lib/theme";
import {
  boardLaneDefinitions,
  projectTypeToneMap,
  statusToneMap,
  typeFilters,
} from "./projects.data";
import type { BoardLane } from "./projects.types";

export default function ProjectsPage() {
  const companyLookup = Object.fromEntries(COMPANIES.map(company => [company.id, company.name]));
  const activeProjects = PROJECTS.filter(project => project.status === "ACTIVE");
  const completedProjects = PROJECTS.filter(project => project.status === "COMPLETED");
  const uniqueDistricts = new Set(PROJECTS.map(project => project.district));

  const boardLanes: BoardLane[] = boardLaneDefinitions.map(definition => ({
    ...definition,
    projects: PROJECTS.filter(definition.filter).map(project => ({
      ...project,
      companyName: companyLookup[project.companyId] ?? "—",
    })),
  }));

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1500px] space-y-8">
        <PageHeader
          title="Projects"
          description="Adaptive boards keep every crew, district, and finance touchpoint aligned in real time."
          actions={
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                <Users2 className="h-4 w-4" />
                All customers
              </Link>
              <NewProjectLauncher companies={COMPANIES} />
            </div>
          }
        />

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/60">Adaptive boards</p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Live workload lanes</h2>
            </div>
            <Link
              href="/projects/completed"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
            >
              <ArrowUpRight className="h-4 w-4" />
              Completed
            </Link>
          </div>
          <div className="overflow-x-auto pb-6">
            <div className="grid min-w-[860px] grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 lg:gap-6">
              {boardLanes
                .filter(lane => lane.id !== "closeout")
                .map(lane => {
                const loadPercent = Math.min(
                  100,
                  Math.round((lane.projects.length / Math.max(1, PROJECTS.length)) * 100),
                );

                return (
                  <article
                    id={`lane-${lane.id}`}
                    key={lane.id}
                    className={cn(
                      "rounded-3xl border border-white/10 bg-gradient-to-b p-5 shadow-[0_30px_80px_rgba(3,6,23,0.5)] backdrop-blur-2xl",
                      lane.accent,
                    )}
                  >
                    <header className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-white/60">{lane.label}</p>
                        <p className="text-sm text-white/70">{lane.description}</p>
                      </div>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">
                        {lane.projects.length} proj
                      </span>
                    </header>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>{lane.helper}</span>
                        <span>{loadPercent}% load</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-white/80"
                          style={{ width: `${loadPercent}%` }}
                        />
                      </div>
                    </div>

                    <ul className="mt-5 space-y-3">
                      {lane.projects.map(project => (
                        <li
                          key={project.id}
                          className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-inner"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{project.name}</p>
                              <p className="text-xs text-white/60">
                                {project.companyName} • {project.code}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                                statusToneMap[project.status],
                              )}
                            >
                              {project.status}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                            <span className="rounded-full border border-white/15 px-3 py-1">{project.owner}</span>
                            <span className="rounded-full border border-white/15 px-2.5 py-1">
                              District {project.district}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                                projectTypeToneMap[project.projectType],
                              )}
                            >
                              {project.projectType}
                            </span>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                            <span>Updated 2h ago</span>
                            <Link
                              href={`/projects/${project.companyId}`}
                              className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              Open
                            </Link>
                          </div>
                        </li>
                      ))}
                      {lane.projects.length === 0 && (
                        <li className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-white/60">
                          No projects in this lane yet. Once data matches the rule set, cards will appear here automatically.
                        </li>
                      )}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

