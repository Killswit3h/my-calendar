import type { ChecklistItem, ChecklistStatus } from "@/components/project/ProjectChecklistCard.types";

export const CHECKLIST_STATUS_ORDER: ChecklistStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"];

export const STATUS_LABEL: Record<ChecklistStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};

export const STATUS_CLASS: Record<ChecklistStatus, string> = {
  NOT_STARTED: "bg-white/10 text-white",
  IN_PROGRESS: "bg-amber-500/20 text-amber-200",
  COMPLETE: "bg-emerald-500/20 text-emerald-200",
};

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: "scope", title: "Scope of Work", description: "Review contract scope, plans, and specs." },
  {
    key: "changeOrders",
    title: "Change Orders / Conflicts",
    description: "Log any conflicts, RFIs, or potential COs to raise.",
  },
  {
    key: "materialCompliance",
    title: "Material Compliance Forms",
    description: "Verify all material compliance forms are completed/approved.",
  },
  { key: "eeo", title: "EEO Compliance", description: "Confirm EEO requirements and documentation are up to date." },
  { key: "payroll", title: "Payroll", description: "Verify payroll and certified payroll submissions." },
  {
    key: "locate",
    title: "Locate Tickets",
    description: "Confirm utility locate tickets requested/cleared.",
  },
  {
    key: "onsiteReview",
    title: "Onsite Review",
    description: "Perform onsite review / preconstruction walk-through.",
  },
  {
    key: "materials",
    title: "Materials Ordered / In Stock",
    description: "Confirm materials have been ordered or are available in stock.",
  },
  {
    key: "handrail",
    title: "Handrail Measurements Confirmed Onsite",
    description: "Confirm field measurements for handrail runs and details.",
    visible: (type) => type === "HANDRAIL",
  },
];
