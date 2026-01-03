// Removed module; redirect to 404
import { notFound } from "next/navigation";
export default function Page() {
  notFound();
}
import JobsTable from "@/components/finance/JobsTable";

export default function Page() {
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-lg font-semibold text-neutral-100">Jobs</h1>
      <JobsTable />
    </main>
  );
}
