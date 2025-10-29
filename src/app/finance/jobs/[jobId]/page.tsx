import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getData(jobId: string) {
  const job = await (prisma as any).job.findUnique({ where: { id: jobId }, include: { customer: true } });
  return job;
}

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await getData(jobId);
  if (!job) return null;
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-lg font-semibold text-neutral-100">{job.name}</h1>
      <div className="text-neutral-300">Customer: {job.customer?.name || "—"}</div>
    </main>
  );
}
