import type { ChecklistItem } from "@/components/project/payApplicationTypes";

export const PAY_ITEM_LABEL = "Pay Item";

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: "contract", label: "Contract Signed" },
  { key: "coi", label: "COI" },
  { key: "bond", label: "Bond" },
  { key: "material", label: "Material Compliance Forms" },
  { key: "eeo", label: "EEO Compliance" },
  { key: "payroll", label: "Payroll" },
];

export const PAY_ITEM_RATES: Record<string, number> = {
  "536-8-114": 85.0,
  "536-8-432": 112.0,
  "700-1-11": 9500.0,
  "550-5-125": 120.0,
  "550-7-330": 145.0,
  "999-25": 15000.0,
};
