import type { Project, ProjectType } from "./projects.models";
import type { BoardLaneDefinition } from "./projects.types";

export const statusToneMap: Record<Project["status"], string> = {
  "Not Started": "border-sky-500/30 bg-sky-400/10 text-sky-100",
  "In Progress": "border-emerald-500/30 bg-emerald-400/10 text-emerald-200",
  Completed: "border-white/20 bg-white/5 text-white/70",
};

export const projectTypeToneMap: Record<ProjectType, string> = {
  HANDRAIL: "border-sky-400/20 bg-sky-500/10 text-sky-100",
  GUARDRAIL: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
  FENCE: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  OTHER: "border-purple-400/20 bg-purple-500/10 text-purple-100",
};

/** Used for filters / future subtype views (not required for board lane membership). */
export const mobilizingTypes: ProjectType[] = ["HANDRAIL", "FENCE"];
export const installTypes: ProjectType[] = ["GUARDRAIL", "OTHER"];

/**
 * Board lanes partition projects by workflow status only so every project appears
 * in exactly one lane (new defaults: Not Started + OTHER were previously invisible).
 */
export const boardLaneDefinitions: BoardLaneDefinition[] = [
  {
    id: "mobilizing",
    label: "Mobilizing",
    description: "Permits, pre-con, and supplier alignment",
    helper: "Kickoff tasks synced nightly",
    accent: "from-cyan-400/20 via-transparent to-transparent",
    filter: project => project.status === "Not Started",
  },
  {
    id: "field",
    label: "Field install",
    description: "Crews onsite + inspections scheduled",
    helper: "Look ahead at crew load",
    accent: "from-emerald-400/20 via-transparent to-transparent",
    filter: project => project.status === "In Progress",
  },
  {
    id: "closeout",
    label: "Closeout",
    description: "Punchlists, docs, and finance routing",
    helper: "Docs ready for FDOT upload",
    accent: "from-purple-400/20 via-transparent to-transparent",
    filter: project => project.status === "Completed",
  },
];

export const typeFilters = [
  { label: "All types", active: true },
  { label: "Guardrail", active: false },
  { label: "Handrail", active: false },
  { label: "Fence", active: false },
  { label: "Other", active: false },
];
