/**
 * Canonical branch labels stored on `project.branch`.
 */
export const PROJECT_BRANCH_VALUES = ["South Florida", "Central Florida"] as const

export type ProjectBranchValue = (typeof PROJECT_BRANCH_VALUES)[number]

/** Returns the canonical branch string or `undefined` if `raw` does not match the allowlist (case-insensitive). */
export function resolveAllowedProjectBranch(
  raw: string,
): ProjectBranchValue | undefined {
  const t = raw.trim()
  if (!t) return undefined
  return PROJECT_BRANCH_VALUES.find((b) => b.toLowerCase() === t.toLowerCase())
}
