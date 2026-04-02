import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/theme";
import type { Project } from "@/app/projects/projects.models";
import { projectTypeToneMap, statusToneMap } from "@/app/projects/projects.data";

type ProjectRowProps = {
  project: Project;
  href: string;
  className?: string;
};

export function ProjectRow({ project, href, className }: ProjectRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-left text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-white">{project.name}</p>
            <p className="mt-0.5 text-xs text-white/55">
              {project.code?.trim() ? `Code ${project.code.trim()}` : "No project code"}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
              statusToneMap[project.status],
            )}
          >
            {project.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-white/60">
          {project.owner?.trim() ? (
            <span className="rounded-full border border-white/15 px-3 py-1">{project.owner}</span>
          ) : null}
          {project.district?.trim() ? (
            <span className="rounded-full border border-white/15 px-2.5 py-1">
              District {project.district}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
              projectTypeToneMap[project.projectType],
            )}
          >
            {project.projectType}
          </span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-white/40" aria-hidden />
    </Link>
  );
}
