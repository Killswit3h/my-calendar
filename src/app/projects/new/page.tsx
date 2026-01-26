import type { QuantityItem } from "@/components/project/ProjectQuantitiesCard";
import { ProjectWorkspaceClient } from "../[companyId]/[projectId]/ProjectWorkspaceClient";
import { COMPANIES } from "@/lib/mock/projects";

type PageProps = {
  searchParams?: Promise<{ companyId?: string }>;
};

const NEW_PROJECT_NAME = "New Project";
const emptyQuantities: QuantityItem[] = [];

export default async function NewProjectPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const companyId = search.companyId ?? "new-company";
  const company = COMPANIES.find((c) => c.id === companyId);

  const blankCompany = {
    id: companyId,
    name: company?.name ?? NEW_PROJECT_NAME,
  };

  const blankProject = {
    id: "new-project",
    companyId: blankCompany.id,
    code: "",
    name: NEW_PROJECT_NAME,
    status: "ACTIVE" as const,
    owner: "",
    district: "",
    projectType: "OTHER" as const,
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex w-full max-w-[1900px] flex-col gap-3">
        <ProjectWorkspaceClient
          company={blankCompany}
          project={blankProject}
          quantityItems={emptyQuantities}
          prefillData={false}
        />
      </div>
    </main>
  );
}


