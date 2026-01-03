"use client";

import { useMemo, useState } from "react";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { ProjectRow } from "@/components/ui/ProjectRow";
import type { Project } from "@/lib/mock/projects";

type Props = {
  companyId: string;
  projects: Project[];
};

export function CompanyProjectsClient({ companyId, projects }: Props) {
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const filtered = useMemo(() => projects.filter((project) => project.status === status), [projects, status]);

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="flex justify-center">
        <SegmentedTabs
          value={status}
          onChange={(value) => setStatus(value as "ACTIVE" | "COMPLETED")}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "COMPLETED", label: "Completed" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-white/60">No projects in this view.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <ProjectRow key={project.id} project={project} href={`/projects/${companyId}/${project.id}`} />
          ))}
        </div>
      )}
    </section>
  );
}

