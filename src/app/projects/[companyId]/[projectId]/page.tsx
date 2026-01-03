import { notFound } from "next/navigation";
import { type QuantityItem } from "@/components/project/ProjectQuantitiesCard";
import { COMPANIES, PROJECTS } from "@/lib/mock/projects";
import { ProjectWorkspaceClient } from "./ProjectWorkspaceClient";

type PageProps = {
  params: Promise<{ companyId: string; projectId: string }>;
};

const MOCK_QUANTITIES: Record<string, QuantityItem[]> = {
  "gfc-e8w48": [
    { id: "pay-1", payItem: "536-8-114", description: "Guardrail Removal", contractQty: 1200, installedQty: 720 },
    { id: "pay-2", payItem: "536-8-432", description: "Guardrail Installation", contractQty: 1400, installedQty: 880 },
    { id: "pay-3", payItem: "700-1-11", description: "Traffic Control", contractQty: 1, installedQty: 0.45 },
  ],
  "gfc-m11a2": [
    { id: "pay-4", payItem: "550-5-125", description: "Handrail Fabrication", contractQty: 500, installedQty: 260 },
    { id: "pay-5", payItem: "550-7-330", description: "Handrail Installation", contractQty: 500, installedQty: 240 },
    { id: "pay-6", payItem: "999-25", description: "Mobilization", contractQty: 1, installedQty: 1 },
  ],
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { companyId, projectId } = await params;
  const company = COMPANIES.find((c) => c.id === companyId);
  const project = PROJECTS.find((p) => p.id === projectId && p.companyId === companyId);

  if (!company || !project) {
    notFound();
  }

  const quantityItems = MOCK_QUANTITIES[project.id] ?? [
    { id: "pay-a", payItem: "530-1-120", description: "Fence Removal", contractQty: 800, installedQty: 320 },
    { id: "pay-b", payItem: "530-7-420", description: "Fence Installation", contractQty: 800, installedQty: 280 },
    { id: "pay-c", payItem: "700-1-11", description: "Maintenance of Traffic", contractQty: 1, installedQty: 0.35 },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex w-full max-w-[1900px] flex-col gap-3">
        <ProjectWorkspaceClient company={company} project={project} quantityItems={quantityItems} />
      </div>
    </main>
  );
}

