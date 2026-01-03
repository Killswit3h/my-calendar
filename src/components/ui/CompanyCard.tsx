import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import type { Company } from "@/lib/mock/projects";
import { cn } from "@/lib/theme";

type CompanyCardProps = {
  company: Company;
  href: string;
  totalProjects: number;
  activeProjects: number;
  highlightTags: string[];
  subtitle?: string;
  className?: string;
};

export function CompanyCard({
  company,
  href,
  totalProjects,
  activeProjects,
  highlightTags,
  subtitle,
  className,
}: CompanyCardProps) {
  const completionRatio = totalProjects ? Math.round((activeProjects / totalProjects) * 100) : 0;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(3,6,23,0.55)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-white/10 p-2 text-white/80">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-semibold">{company.name}</p>
            {subtitle ? <p className="text-xs uppercase tracking-[0.32em] text-white/60">{subtitle}</p> : null}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-white/40 transition group-hover:text-white/80" aria-hidden />
      </div>

      <div className="flex items-baseline gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight">{activeProjects}</p>
          <p className="text-xs uppercase tracking-[0.28em] text-white/60">Active</p>
        </div>
        <div className="text-sm text-white/50">
          of <span className="font-medium text-white">{totalProjects}</span> projects
        </div>
        <div className="ml-auto rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
          {completionRatio || 0}% active
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {highlightTags.map(tag => (
          <span
            key={tag}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/70"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}

