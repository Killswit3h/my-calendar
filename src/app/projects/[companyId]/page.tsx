import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { COMPANIES, PROJECTS, type Company } from "@/lib/mock/projects";
import { CompanyProjectsClient } from "./CompanyProjectsClient";

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyProjectsPage({ params }: PageProps) {
  const { companyId } = await params;
  const company = COMPANIES.find((item) => item.id === companyId);
  if (!company) notFound();

  const projects = PROJECTS.filter((project) => project.companyId === company.id);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <CompanyProjectsHeader company={company} />
        <CompanyProjectsClient companyId={company.id} projects={projects} />
      </div>
    </main>
  );
}

function CompanyProjectsHeader({ company }: { company: Company }) {
  return (
    <div className="space-y-4">
      <PageHeader
        title={company.name}
        actions={
          <Link
            href="#"
            className="inline-flex items-center rounded-lg bg-[rgba(27,94,32,1)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[rgba(27,94,32,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(27,94,32,0.6)]"
          >
            New Project
          </Link>
        }
      />
    </div>
  );
}


