import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { COMPANIES, PROJECTS } from "@/lib/mock/projects";
import { cn } from "@/lib/theme";

export default function CompletedProjectsPage() {
  const companyLookup = Object.fromEntries(COMPANIES.map(company => [company.id, company.name]));
  const completed = PROJECTS.filter(project => project.status === "COMPLETED").map(project => ({
    ...project,
    companyName: companyLookup[project.companyId] ?? "—",
  }));

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>

        <PageHeader
          title="Completed projects"
          description="Projects marked as completed across all customers."
          tone="glass"
        />

        <section className="space-y-3">
          {completed.map(project => (
            <article
              key={project.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_12px_36px_rgba(3,6,23,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/50">Completed</p>
                  <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                  <p className="text-xs text-white/60">
                    {project.companyName} • {project.code}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
                  Done
                </span>
              </div>

            </article>
          ))}

          {!completed.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              No completed projects found.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function projectTypeTone(projectType: string) {
  switch (projectType) {
    case "HANDRAIL":
      return "border-sky-400/20 bg-sky-500/10 text-sky-100";
    case "GUARDRAIL":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
    case "FENCE":
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
    default:
      return "border-purple-400/20 bg-purple-500/10 text-purple-100";
  }
}

