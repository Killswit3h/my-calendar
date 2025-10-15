// components/calendar/colors.ts
export type JobType = "GUARDRAIL" | "FENCE" | "HANDRAIL" | "TEMP_FENCE" | "ATTENUATOR";

export const JOB_TYPE_COLOR: Record<JobType, { solid: string; glass: string; dot: string }> = {
  GUARDRAIL: { solid: "#22c55e", glass: "rgba(34,197,94,0.16)", dot: "#22c55e" },   // green
  FENCE:     { solid: "#fb923c", glass: "rgba(251,146,60,0.16)", dot: "#f97316" },   // orange
  HANDRAIL:  { solid: "#60a5fa", glass: "rgba(96,165,250,0.16)", dot: "#3b82f6" },   // blue
  TEMP_FENCE:{ solid: "#facc15", glass: "rgba(250,204,21,0.16)", dot: "#eab308" },   // yellow
  ATTENUATOR:{ solid: "#ef4444", glass: "rgba(239,68,68,0.16)",  dot: "#ef4444" },   // red
};

export function normalizeJobType(input?: unknown): JobType {
  const v = String(input ?? "").toUpperCase();
  if (v.includes("ATTEN")) return "ATTENUATOR";
  if (v.includes("TEMP") && v.includes("FENC")) return "TEMP_FENCE";
  if (v.includes("GUARD")) return "GUARDRAIL";
  if (v.includes("HAND")) return "HANDRAIL";
  if (v.includes("FENC")) return "FENCE";
  // Default to GUARDRAIL if missing to ensure visibility. Adjust if needed.
  return "GUARDRAIL";
}
