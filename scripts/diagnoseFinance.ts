import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function resolveEventInclude(client: PrismaClient) {
  const include: Record<string, true> = {};
  try {
    const runtime = (client as any)._runtimeDataModel;
    const eventFields: any[] = runtime?.models?.Event?.fields ?? [];
    const relations = new Set(
      eventFields.filter((field: any) => field?.kind === "object" && field?.name).map((field: any) => field.name)
    );
    if (relations.has("assignments")) include.assignments = true;
    if (relations.has("assignees")) include.assignees = true;
    if (relations.has("EmployeeAssignment")) include.EmployeeAssignment = true;
    if (relations.has("laborDailyRows")) include.laborDailyRows = true;
  } catch {
    // ignore – we'll fall back to no include if detection blows up
  }
  return include;
}

function collectAssigneeIds(event: any): string[] {
  const ids = new Set<string>();
  event?.EmployeeAssignment?.forEach?.((row: any) => row?.employeeId && ids.add(row.employeeId));
  event?.assignees?.forEach?.((row: any) => row?.employeeId && ids.add(row.employeeId));
  event?.assignments?.forEach?.((row: any) => row?.employeeId && ids.add(row.employeeId));
  event?.laborDailyRows?.forEach?.((row: any) => row?.employeeId && ids.add(row.employeeId));
  return Array.from(ids);
}

async function main() {
  const [{ jobs }, events, employees] = await Promise.all([
    (async () => {
      try { const jobs = await (prisma as any).job.findMany({ include: { customer: true } }); return { jobs }; }
      catch { const projects = await (prisma as any).project.findMany({ include: { customer: true } });
        return { jobs: projects.map((p:any)=>({ id:p.id, slug:p.slug??null, name:p.name, code:p.code??null, customerId:p.customerId??null, customer:p.customer??null })) };
      }
    })(),
    (async () => {
      const include = resolveEventInclude(prisma);
      if (Object.keys(include).length) {
        try {
          return (await (prisma as any).event.findMany({ include })) as any[];
        } catch {
          // ignore
        }
      }
      return (prisma as any).event.findMany();
    })(),
    (prisma as any).employee.findMany(),
  ]);
  console.log(`Jobs: ${jobs.length}, Events: ${events.length}, Employees: ${employees.length}`);
  const byJob = new Map<string, any[]>();
  for (const e of events) {
    const jid = e.projectId || e.jobId || null;
    if (!jid) continue;
    const arr = byJob.get(jid) || [];
    arr.push(e);
    byJob.set(jid, arr);
  }
  for (const j of jobs) {
    const ev = byJob.get(j.id) || [];
    const assigneeIds = ev.flatMap(e => collectAssigneeIds(e));
    const assigneeSet = new Set(assigneeIds);
    const crew = assigneeSet.size;
    const missingRates: string[] = [];
    for (const id of assigneeSet) {
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
