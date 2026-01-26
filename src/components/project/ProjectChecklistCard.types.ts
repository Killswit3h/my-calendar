import type { ProjectType } from "@/lib/mock/projects";

export type ChecklistKey =
  | "scope"
  | "changeOrders"
  | "materialCompliance"
  | "eeo"
  | "payroll"
  | "locate"
  | "onsiteReview"
  | "materials"
  | "handrail";

export type ChecklistStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export type ChecklistItem = {
  key: ChecklistKey;
  title: string;
  description: string;
  visible?: (type?: ProjectType) => boolean;
};
