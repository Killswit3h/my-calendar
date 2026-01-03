import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Project } from "@/lib/mock/projects";
import { cn } from "@/lib/theme";

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
      <div className="flex w-full items-center gap-4">
        <div className="flex-1 text-base font-medium text-white">{project.name}</div>
        <ChevronRight className="h-5 w-5 text-white/40" aria-hidden />
      </div>
    </Link>
  );
}

