import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const [{ jobs }, events, employees] = await Promise.all([
    (async () => {
      try { const jobs = await (prisma as any).job.findMany({ include: { customer: true } }); return { jobs }; }
      catch { const projects = await (prisma as any).project.findMany({ include: { customer: true } });
        return { jobs: projects.map((p:any)=>({ id:p.id, slug:p.slug??null, name:p.name, code:p.code??null, customerId:p.customerId??null, customer:p.customer??null })) };
      }
    })(),
    (prisma as any).event.findMany({ include: { EmployeeAssignment: true } }),
    (prisma as any).employee.findMany(),
  ]);
  console.log(`Jobs: ${jobs.length}, Events: ${events.length}, Employees: ${employees.length}`);
  const byJob = new Map<string, any[]>();
  for (const e of events) {
    const jid = e.jobId || null;
    if (!jid) continue;
    const arr = byJob.get(jid) || [];
    arr.push(e);
    byJob.set(jid, arr);
  }
  for (const j of jobs) {
    const ev = byJob.get(j.id) || [];
    const assignees = new Set<string>();
    ev.forEach(e => e.EmployeeAssignment?.forEach((a: any) => a?.employeeId && assignees.add(a.employeeId)));
    const crew = assignees.size;
    const missingRates: string[] = [];
    for (const id of assignees) {
      const emp = employees.find((x:any) => x.id === id);
      if (!emp?.hourlyRate) missingRates.push(emp?.name || id);
    }
    const problems: string[] = [];
    if (ev.length === 0) problems.push("NO_EVENTS_LINKED");
    if (crew === 0) problems.push("NO_EMPLOYEES_ASSIGNED");
    if (missingRates.length) problems.push("MISSING_HOURLY_RATE:" + missingRates.join(","));
    console.log(`[${j.id}] ${j.name} -> events=${ev.length}, crew=${crew} ${problems.length ? "| " + problems.join(" | ") : ""}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
