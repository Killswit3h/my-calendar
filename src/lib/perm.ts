import { prisma } from "@/lib/prisma";

export type ShareRole = "VIEWER" | "EDITOR";

export async function getTokenRole(
  token?: string,
  calendarId?: string
): Promise<ShareRole | null> {
  if (!token || !calendarId) return null;
  const t = await prisma.shareToken.findUnique({ where: { id: token } });
  if (!t) return null;
  if (t.calendarId !== calendarId) return null;
  if (t.expiresAt && t.expiresAt < new Date()) return null;
  return t.role as ShareRole;
}

export function canWrite(role: ShareRole | null) {
  return role === "EDITOR";
}
