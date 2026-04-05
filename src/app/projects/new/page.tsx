import { CHECKLIST_ITEMS } from "@/components/project/payApplicationConstants";
import { ProjectWorkspaceClient } from "../[companyId]/[projectId]/ProjectWorkspaceClient";
import type { Project } from "../projects.models";
import { fetchCustomers } from "../projects.api";

type PageProps = {
  searchParams?: Promise<{ companyId?: string }>;
};

const NEW_PROJECT_NAME = "New Project";

const blankProcedureChecklist: Project["procedureChecklist"] = Object.fromEntries(
  CHECKLIST_ITEMS.map(({ key }) => [key, "NOT_STARTED" as const]),
) as Project["procedureChecklist"];

export default async function NewProjectPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const customers = await fetchCustomers()
  const companyId = search.companyId ?? "new-company";
  const company = customers.find((c) => c.id === companyId);

  const blankCompany = {
    id: companyId,
    name: company?.name ?? NEW_PROJECT_NAME,
  };

  const blankProject: Project = {
    id: "new-project",
    companyId: blankCompany.id,
    code: "",
    name: NEW_PROJECT_NAME,
    status: "Not Started",
    owner: "",
    district: "",
    projectType: "OTHER",
    procedureChecklist: blankProcedureChecklist,
    payApplicationNotes: "",
    payApplicationInvoiceNumber: "",
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex w-full max-w-[1900px] flex-col gap-3">
        <ProjectWorkspaceClient company={blankCompany} project={blankProject} initialPayLines={[]} />
      </div>
    </main>
  );
}


