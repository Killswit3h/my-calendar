import { notFound, redirect } from "next/navigation";
import { ProjectWorkspaceClient } from "./ProjectWorkspaceClient";
import { fetchCustomers, fetchProjectById } from "../../projects.api";
import { loadProjectPayItemsWithRollups } from "../../loadProjectPayRollups";

type PageProps = {
  params: Promise<{ companyId: string; projectId: string }>;
};

const UNASSIGNED_COMPANY_ID = "unassigned";

export default async function ProjectDetailPage({ params }: PageProps) {
  const { companyId, projectId } = await params;

  let project: Awaited<ReturnType<typeof fetchProjectById>>["project"];
  let fetchedCompany: Awaited<ReturnType<typeof fetchProjectById>>["company"];
  let initialPayLines: Awaited<ReturnType<typeof loadProjectPayItemsWithRollups>>["projectPayItems"];

  try {
    const [projectBundle, rollups] = await Promise.all([
      fetchProjectById(projectId),
      loadProjectPayItemsWithRollups(projectId),
    ]);
    project = projectBundle.project;
    fetchedCompany = projectBundle.company;
    initialPayLines = rollups.projectPayItems;
  } catch {
    notFound();
  }

  // Project has a customer: URL must use that id (fixes 404 after create if path was wrong).
  if (project.companyId !== UNASSIGNED_COMPANY_ID && project.companyId !== companyId) {
    redirect(`/projects/${project.companyId}/${projectId}`);
  }

  // No customer on record: keep page usable when URL still has the company the user picked.
  let company = fetchedCompany;
  if (project.companyId === UNASSIGNED_COMPANY_ID) {
    const customers = await fetchCustomers();
    const fromUrl = customers.find((c) => c.id === companyId);
    company =
      fromUrl ?? {
        id: companyId,
        name: fetchedCompany.name || `Customer ${companyId}`,
      };
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex w-full max-w-[1900px] flex-col gap-3">
        <ProjectWorkspaceClient
          key={projectId}
          company={company}
          project={project}
          initialPayLines={initialPayLines}
        />
      </div>
    </main>
  );
}

