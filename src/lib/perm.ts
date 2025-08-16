// src/lib/perm.ts
import { prisma } from "@/lib/prisma";

/**
 * Return the role granted by a share token for a specific calendar,
 * or null if the token is missing/invalid/expired/for another calendar.
 */
export async function getTokenRole(
  token: string | undefined,
  calendarId: string
): Promise<"EDITOR" | "VIEWER" | null> {
  if (!token) return null;

  const t = await prisma.shareToken.findUnique({
    where: { id: token },
    select: { id: true, role: true, calendarId: true, expiresAt: true },
  });

  if (!t) return null;
  if (t.calendarId !== calendarId) return null;
  if (t.expiresAt && t.expiresAt < new Date()) return null;

  return t.role as "EDITOR" | "VIEWER";
}

/** Can this role write? */
export function canWrite(role: "EDITOR" | "VIEWER" | null): boolean {
  return role === "EDITOR";
}
