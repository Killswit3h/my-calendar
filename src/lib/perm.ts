// src/lib/perm.ts
import { prisma } from "@/lib/prisma";

/**
 * Accepts EITHER:
 *   getTokenRole(token: string | undefined, calendarId: string)
 * OR:
 *   getTokenRole({ token?: string, calendarId: string })
 */
export async function getTokenRole(
  tokenOrObj: string | undefined | { token?: string; calendarId: string },
  calendarIdArg?: string
): Promise<"EDITOR" | "VIEWER" | null> {
  let token: string | undefined;
  let calendarId: string;

  if (typeof tokenOrObj === "string" || typeof tokenOrObj === "undefined") {
    token = tokenOrObj;
    calendarId = String(calendarIdArg ?? "");
  } else {
    token = tokenOrObj.token;
    calendarId = tokenOrObj.calendarId;
  }

  if (!token) return null;

  const t = await prisma.shareToken.findUnique({
    where: { id: token },
    select: { id: true, role: true, calendarId: true, expiresAt: true },
  });

  if (!t) return null;
  if (t.calendarId !== calendarId) return null;
  if (t.expiresAt && t.expiresAt < new Date()) return null;

  // Types from Prisma are string enums; narrow to our union
  return (t.role === "EDITOR" || t.role === "VIEWER") ? t.role : null;
}

/** Can this role write? */
export function canWrite(role: "EDITOR" | "VIEWER" | null): boolean {
  return role === "EDITOR";
}
