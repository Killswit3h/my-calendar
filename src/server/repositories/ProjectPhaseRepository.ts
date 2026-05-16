import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

export type ProjectPhaseWithLines = Prisma.project_phaseGetPayload<{
  include: { lines: true }
}>

/**
 * Data access for `project_phase` (pay application nested phases + lines).
 */
export class ProjectPhaseRepository extends AbstractRepository<
  ProjectPhaseWithLines,
  Prisma.project_phaseCreateInput,
  Prisma.project_phaseUpdateInput,
  Prisma.project_phaseWhereUniqueInput,
  Prisma.project_phaseWhereInput
> {
  protected getModelName(): string {
    return "project_phase"
  }

  /**
   * Phases for a project with lines ordered by `sort_order`.
   */
  async findWithLinesByProjectId(
    projectId: number,
    client?: PrismaClient | Prisma.TransactionClient,
  ): Promise<ProjectPhaseWithLines[]> {
    return this.findMany(
      { project_id: projectId },
      {
        include: { lines: { orderBy: { sort_order: "asc" } } },
        orderBy: [{ sort_order: "asc" }, { id: "asc" }],
      },
      client,
    ) as Promise<ProjectPhaseWithLines[]>
  }

  /**
   * Removes all phases for a project (cascades to `project_phase_line`).
   */
  async deleteAllForProject(
    projectId: number,
    client?: PrismaClient | Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = client ?? (await this.getClient())
    await prisma.project_phase.deleteMany({ where: { project_id: projectId } })
  }
}
