"use client";

import { useState } from "react";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import PayApplicationWorkspace, { type PayApplicationView } from "@/components/project/PayApplicationWorkspace";
import type { QuantityItem } from "@/components/project/ProjectQuantitiesCard";
import type { Company, Project } from "@/lib/mock/projects";

const PROJECT_STATUS_LABELS: Record<Project["status"], string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

type Props = {
  company: Company;
  project: Project;
  quantityItems: QuantityItem[];
  prefillData?: boolean;
};

export function ProjectWorkspaceClient({ company, project, quantityItems, prefillData = true }: Props) {
  const [viewMode, setViewMode] = useState<PayApplicationView>("contract");

  return (
    <>
      <ProjectHeader
        companyId={company.id}
        companyName={company.name}
        projectCode={project.code}
        projectName={project.name}
        owner={project.owner}
        district={project.district}
        status={PROJECT_STATUS_LABELS[project.status]}
        viewMode={viewMode}
        onChangeView={setViewMode}
      />

      <PayApplicationWorkspace payItems={quantityItems} viewMode={viewMode} prefillData={prefillData} />
    </>
  );
}


