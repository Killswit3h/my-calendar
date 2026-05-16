import { ProjectPhaseService } from "@/server/services/ProjectPhaseService"
import { formatPhasesForApi, type ApiProjectPhase } from "@/lib/projectPhaseApiFormat"

/**
 * Loads pay-application phases for the project workspace (server-only).
 */
export async function loadProjectPhasesForProject(
  projectId: string,
): Promise<{ phases: ApiProjectPhase[] }> {
  const idNum = Number.parseInt(projectId, 10)
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return { phases: [] }
  }
  const service = new ProjectPhaseService()
  try {
    const rows = await service.listForProject(idNum)
    return { phases: formatPhasesForApi(rows) }
  } catch {
    return { phases: [] }
  }
}
