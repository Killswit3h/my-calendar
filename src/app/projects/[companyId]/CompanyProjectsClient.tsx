"use client";

import { useMemo, useState } from "react";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { ProjectRow } from "@/components/ui/ProjectRow";
import type { Project } from "@/lib/mock/projects";

const PROJECT_STATUS = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;

type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

const isProjectStatus = (value: string): value is ProjectStatus =>
  value === PROJECT_STATUS.ACTIVE || value === PROJECT_STATUS.COMPLETED;

type Props = {
  companyId: string;
  projects: Project[];
};

export function CompanyProjectsClient({ companyId, projects }: Props) {
  const [status, setStatus] = useState<ProjectStatus>(PROJECT_STATUS.ACTIVE);
  const filtered = useMemo(() => projects.filter((project) => project.status === status), [projects, status]);
  const handleStatusChange = (value: string) => {
    if (isProjectStatus(value)) {
      setStatus(value);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="flex justify-center">
        <SegmentedTabs
          value={status}
          onChange={handleStatusChange}
          options={[
            { value: PROJECT_STATUS.ACTIVE, label: "Active" },
            { value: PROJECT_STATUS.COMPLETED, label: "Completed" },
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

