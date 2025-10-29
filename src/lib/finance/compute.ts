import { PrismaClient } from "@prisma/client";
import { inclusiveDaySpan } from "@/lib/finance/date";
import { FinanceJobRow, FinanceWarning } from "@/lib/finance/types";

const prisma = new PrismaClient();

type AnyEvent = {
  id: string;
  title?: string | null;
  jobId?: string | null;
  customerId?: string | null;
  metadata?: any | null;
  start: Date;
  end: Date;
  EmployeeAssignment?: { employeeId: string }[];
  assignees?: { employeeId: string }[];
};
type AnyEmployee = { id: string; name: string | null; hourlyRate?: number | null };
type AnyJob = {
  id: string;
  slug?: string | null;
  name: string;
  code?: string | null;
  customerId?: string | null;
  customer?: { name: string | null } | null;
};

type AnyProject = AnyJob;

async function loadJobsOrProjects(): Promise<{ jobs: AnyJob[]; usedModel: "job" | "project" }> {
  try {
    const jobs = await (prisma as any).job.findMany({ include: { customer: true } });
    if (Array.isArray(jobs)) return { jobs, usedModel: "job" };
  } catch {}
  try {
    const projects: AnyProject[] = await (prisma as any).project.findMany({ include: { customer: true } });
    const jobsLike: AnyJob[] = projects.map(p => ({
      id: p.id, slug: p.slug ?? null, name: p.name, code: p.code ?? null,
      customerId: p.customerId ?? null, customer: p.customer ?? null,
    }));
    return { jobs: jobsLike, usedModel: "project" };
  } catch {}
  return { jobs: [], usedModel: "job" };
}

function fuzzyMatchJob(event: AnyEvent, jobs: AnyJob[]): AnyJob | undefined {
  const key = (event?.metadata?.jobKey as string | undefined)?.toLowerCase();
  const title = (event?.title || "").toLowerCase();
  if (!jobs?.length) return undefined;
  if (key) {
    const viaKey = jobs.find(j =>
      j.code?.toLowerCase() === key || j.slug?.toLowerCase() === key || j.name.toLowerCase() === key
    );
    if (viaKey) return viaKey;
  }
  if (title) {
    return (
      jobs.find(j => j.code && title.includes(j.code.toLowerCase())) ||
      jobs.find(j => j.slug && title.includes(j.slug.toLowerCase())) ||
      jobs.find(j => title.includes(j.name.toLowerCase()))
    );
  }
  return undefined;
}

function collectAssigneeIds(e: AnyEvent): string[] {
  const a = new Set<string>();
  e.EmployeeAssignment?.forEach(x => x?.employeeId && a.add(x.employeeId));
  e.assignees?.forEach(x => x?.employeeId && a.add(x.employeeId));
  return Array.from(a);
}

async function getOptionalTimeEntries(jobId: string) {
  try {
    const timeEntries = await (prisma as any).timeEntry?.findMany?.({
      where: { jobId },
      select: { hours: true, employeeId: true, hourlyRate: true },
    });
    if (Array.isArray(timeEntries)) return timeEntries;
  } catch {}
  return null;
}

export async function computeFinanceRows(): Promise<FinanceJobRow[]> {
  const [{ jobs }, events, employees] = await Promise.all([
    loadJobsOrProjects(),
    (prisma as any).event.findMany({ include: { EmployeeAssignment: true } }) as Promise<AnyEvent[]>,
    (prisma as any).employee.findMany() as Promise<AnyEmployee[]>,
  ]);

  const empMap = new Map<string, AnyEmployee>();
  employees.forEach(e => empMap.set(e.id, e));

  const byId = new Map<string, AnyJob>();
  const byCustomer = new Map<string, AnyJob[]>();
  jobs.forEach(j => {
    if (j.id) byId.set(j.id, j);
    if (j.customerId) {
      const arr = byCustomer.get(j.customerId) || [];
      arr.push(j);
      byCustomer.set(j.customerId, arr);
    }
  });

  const jobEvents = new Map<string, AnyEvent[]>();
  for (const e of events) {
    let job: AnyJob | undefined;
    if (e.jobId && byId.has(e.jobId)) job = byId.get(e.jobId);
    if (!job && e.customerId && byCustomer.has(e.customerId)) job = byCustomer.get(e.customerId)![0];
    if (!job) job = fuzzyMatchJob(e, jobs);
    if (!job) continue;
    const list = jobEvents.get(job.id) || [];
    list.push(e);
    jobEvents.set(job.id, list);
  }

  const rows: FinanceJobRow[] = [];

  for (const job of jobs) {
    const warnings: { code: FinanceWarning; detail: string }[] = [];
    const evts = jobEvents.get(job.id) || [];
    if (evts.length === 0) warnings.push({ code: "NO_EVENTS_LINKED", detail: "No events linked to this job." });

    let totalDays = 0;
    const employeeIds = new Set<string>();

    for (const e of evts) {
      if (!e.start || !e.end || Number.isNaN(+new Date(e.start)) || Number.isNaN(+new Date(e.end))) {
        warnings.push({ code: "INVALID_EVENT_DATES", detail: `Event ${e.id} has invalid dates.` });
        continue;
      }
      const days = Math.max(0, inclusiveDaySpan(e.start, e.end));
      totalDays += days;
      collectAssigneeIds(e).forEach(id => employeeIds.add(id));
    }

    const crewCount = employeeIds.size;

    let totalHours = 0;
    const timeEntries = await getOptionalTimeEntries(job.id);
    if (timeEntries && timeEntries.length > 0) {
      totalHours = timeEntries.reduce((s: number, t: any) => s + (Number(t.hours) || 0), 0);
    } else {
      totalHours = crewCount * totalDays * 8;
    }
    if (totalHours === 0) warnings.push({ code: "ZERO_HOURS_COMPUTED", detail: "No explicit or fallback hours." });
    if (crewCount === 0) warnings.push({ code: "NO_EMPLOYEES_ASSIGNED", detail: "No employees assigned on events." });

    let totalLaborCost = 0;
    if (timeEntries && timeEntries.length > 0) {
      for (const t of timeEntries) {
        const hrs = Number(t.hours) || 0;
        const rate = t.hourlyRate ?? (t.employeeId ? empMap.get(t.employeeId)?.hourlyRate ?? 0 : 0);
        if (!rate) warnings.push({ code: "MISSING_HOURLY_RATE", detail: `Missing rate for entry ${t.employeeId || "unknown"}.` });
        totalLaborCost += hrs * rate;
      }
    } else {
      const perEmpHours = crewCount > 0 ? totalHours / crewCount : 0;
      for (const id of Array.from(employeeIds)) {
        const rate = empMap.get(id)?.hourlyRate ?? 0;
        if (!rate) warnings.push({ code: "MISSING_HOURLY_RATE", detail: `Missing hourly rate for employee ${empMap.get(id)?.name || id}.` });
        totalLaborCost += perEmpHours * rate;
      }
    }

    let detailsUrl: string | undefined;
    if (job.id) detailsUrl = `/finance/jobs/${job.id}`;
    else if (job.slug) detailsUrl = `/finance/jobs/slug/${job.slug}`;
    else warnings.push({ code: "BROKEN_DETAILS_LINK", detail: "No id or slug for job." });

    rows.push({
      jobId: job.id,
      jobSlug: job.slug ?? null,
      jobName: job.name,
      customerName: job.customer?.name ?? null,
      crewCount,
      totalDays,
      totalHours,
      totalLaborCost: Math.round(totalLaborCost * 100) / 100,
      warnings,
      detailsUrl,
    });
  }

  return rows;
}
