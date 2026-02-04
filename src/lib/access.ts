// Local types - AccessArea model does not exist in the current Prisma schema
export type AccessArea = 'ADMIN' | 'CALENDAR' | 'REPORTS' | 'FINANCE' | 'PAYROLL' | 'SETTINGS'

export class AccessDeniedError extends Error {
  status: number

  constructor(message = 'Forbidden', status = 403) {
    super(message)
    this.name = 'AccessDeniedError'
    this.status = status
  }
}

// Stub implementations - return permissive defaults since access control model is not set up
export async function getUserAreas(_userId?: string | null): Promise<AccessArea[]> {
  // Return all areas by default since the access control model is not configured
  return ['ADMIN', 'CALENDAR', 'REPORTS', 'FINANCE', 'PAYROLL', 'SETTINGS']
}

export async function hasAccess(_userId: string, _area: AccessArea): Promise<boolean> {
  // Allow all access by default since the access control model is not configured
  return true
}

export async function setUserArea(_userId: string, _area: AccessArea, _enabled: boolean): Promise<void> {
  // No-op since the access control model is not configured
}

export async function requireAccess(_area: AccessArea, _opts?: { userId?: string }) {
  // Allow all access by default since the access control model is not configured
  return { userId: 'system' }
}

