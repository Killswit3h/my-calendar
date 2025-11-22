import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'

export type ProjectLink = {
  customerId: string
  projectId: string
}

type ParsedTitle = { customerName: string; jobName: string | null };

const DEFAULT_JOB_NAME = 'General';

const normalize = (value: string): string =>
  value.trim().replace(/[.\s]+$/g, '').replace(/\s+/g, ' ');

export function parseCustomerJob(title: string): ParsedTitle | null {
  if (typeof title !== 'string') return null;
  const trimmed = title.trim();
  if (!trimmed) return null;
  const idx = trimmed.indexOf(':');
  if (idx === -1) {
    return { customerName: trimmed, jobName: null };
  }

  const customerName = trimmed.slice(0, idx).trim();
  const jobName = trimmed.slice(idx + 1).trim();
  if (!customerName) return null;

  return { customerName, jobName: jobName || null };
}

async function lookupCustomer(name: string) {
  return prisma.customer.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
}

async function findCustomerId(customerName: string): Promise<string | null> {
  const direct = await lookupCustomer(customerName);
  if (direct?.id) return direct.id;

  const normalized = normalize(customerName);
  if (normalized !== customerName) {
    const fallback = await lookupCustomer(normalized);
    if (fallback?.id) return fallback.id;
  }

  return null;
}

async function lookupProject(customerId: string, name: string) {
  return prisma.project.findFirst({
    where: {
      customerId,
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true },
  });
}

async function findProjectId(customerId: string, jobName: string): Promise<string | null> {
  const direct = await lookupProject(customerId, jobName);
  if (direct?.id) return direct.id;

  const normalized = normalize(jobName);
  if (normalized !== jobName) {
    const fallback = await lookupProject(customerId, normalized);
    if (fallback?.id) return fallback.id;
  }
  return null;
}

export async function ensureProjectForEventTitle(title: string): Promise<ProjectLink | null> {
  const parsed = parseCustomerJob(title);
  if (!parsed) return null;

  const { customerName } = parsed;
  const jobName = parsed.jobName && parsed.jobName.length > 0 ? parsed.jobName : DEFAULT_JOB_NAME;

  const customerId = await findCustomerId(customerName);
  if (!customerId) return null;

  const existingProjectId = await findProjectId(customerId, jobName);
  if (existingProjectId) return { customerId, projectId: existingProjectId };

  try {
    const created = await prisma.project.create({
      data: { customerId, name: jobName },
      select: { id: true },
    });
    return { customerId, projectId: created.id };
  } catch (error: any) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === 'P2002') {
      const fallbackId = await findProjectId(customerId, jobName);
      if (fallbackId) return { customerId, projectId: fallbackId };
    }
    throw error;
  }
}
