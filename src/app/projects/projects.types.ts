import type { Project } from "@/lib/mock/projects";

export type BoardLaneDefinition = {
  id: string;
  label: string;
  description: string;
  helper: string;
  accent: string;
  filter: (project: Project) => boolean;
};

export type BoardLane = BoardLaneDefinition & {
  projects: Array<Project & { companyName: string }>;
};
