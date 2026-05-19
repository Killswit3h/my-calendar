"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import type { ProjectFormState } from "@/app/projects/projects.models";
import PayApplicationWorkspace, { type PayApplicationView } from "@/components/project/PayApplicationWorkspace";
import { CHECKLIST_ITEMS } from "@/components/project/payApplicationConstants";
import type { ChecklistStatus } from "@/components/project/payApplicationTypes";
import {
  deleteProjectPayItemApi,
  patchProjectPayItemApi,
  postProjectPayItemApi,
} from "../../projects.api";
import {
  buildProjectPatchBodyForSave,
  buildProjectPostBodyForSave,
} from "../../projectWorkspaceSavePayload";
import type {
  Company,
  ProcedureChecklistKey,
  Project,
  ProjectPayItemView,
} from "../../projects.models";
import type { ApiProjectPhase } from "@/lib/projectPhaseApiFormat";
import type { Phase } from "@/components/project/payApplicationTypes";
import { mapApiPhasesToWorkspacePhases } from "../../mapApiPhasesToWorkspacePhases";
import { mergePhasesWithPayLines } from "../../mergePhasesWithPayLines";
import { buildPhasesPutPayload } from "../../buildPhasesPutPayload";

const PROJECT_STATUS_LABELS: Record<Project["status"], string> = {
  "Not Started": "Not Started",
  "In Progress": "In Progress",
  Completed: "Completed",
};

const viewStorageKey = (projectId: string) => `project-workspace-view:${projectId}`;

function isTempPayLineId(id: string): boolean {
  return id.startsWith("temp-");
}

function buildProjectPayItemPatchBody(line: ProjectPayItemView): Record<string, unknown> {
  return {
    pay_item_number: line.payItemNumber.trim(),
    pay_item_description: line.payItemDescription.trim() || null,
    pay_item_unit: line.unit.trim() || "ea",
    contracted_quantity: line.contractedQuantity,
    unit_rate: line.unitRate,
    stockpile_billed: line.stockpileBilled,
    notes: line.notes?.trim() ? line.notes.trim() : null,
    begin_station: line.beginStation?.trim() ? line.beginStation.trim() : null,
    end_station: line.endStation?.trim() ? line.endStation.trim() : null,
    status: line.status?.trim() ? line.status.trim() : null,
    locate_ticket: line.locateTicket?.trim() ? line.locateTicket.trim() : null,
    LF_RT: line.lfRt?.trim() ? line.lfRt.trim() : null,
    onsite_review: line.onsiteReview?.trim() ? line.onsiteReview.trim() : null,
    ready_to_work_date: line.readyToWorkDate ?? null,
    status_date: line.statusDate ?? null,
    surveyed: line.surveyed ?? null,
  };
}

function newTempPayLine(
  projectId: string,
  draft: { payItemNumber: string; description: string; contractQty: number },
): ProjectPayItemView {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    projectId,
    payItemId: "",
    payItemNumber: draft.payItemNumber,
    payItemDescription: draft.description,
    unit: "ea",
    unitRate: 0,
    contractedQuantity: draft.contractQty,
    installedQuantity: 0,
    stockpileBilled: 0,
  };
}

type Props = {
  company: Company;
  project: Project;
  initialPayLines: ProjectPayItemView[];
  initialApiPhases?: ApiProjectPhase[];
};

export function ProjectWorkspaceClient({
  company,
  project,
  initialPayLines,
  initialApiPhases = [],
}: Props) {
  const [viewMode, setViewMode] = useState<PayApplicationView>("contract");
  const [liveInvoiceNumber, setLiveInvoiceNumber] = useState(project.payApplicationInvoiceNumber);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPhases, setIsSavingPhases] = useState(false);
  const [payLines, setPayLines] = useState<ProjectPayItemView[]>(initialPayLines);
  const [phases, setPhases] = useState<Phase[]>(() =>
    mapApiPhasesToWorkspacePhases(initialApiPhases, initialPayLines),
  );
  const [checklist, setChecklist] = useState<Record<string, ChecklistStatus>>(() => {
    const m: Record<string, ChecklistStatus> = {};
    for (const { key } of CHECKLIST_ITEMS) {
      const k = key as ProcedureChecklistKey;
      m[key] = project.procedureChecklist[k] ?? "NOT_STARTED";
    }
    return m;
  });
  const [notes, setNotes] = useState(project.payApplicationNotes);
  const router = useRouter();

  useEffect(() => {
    setLiveInvoiceNumber(project.payApplicationInvoiceNumber);
  }, [project.payApplicationInvoiceNumber]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(viewStorageKey(project.id));
      if (stored === "contract" || stored === "phases") {
        setViewMode(stored);
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, [project.id]);

  const setViewModePersist = useCallback(
    (mode: PayApplicationView) => {
      setViewMode(mode);
      try {
        sessionStorage.setItem(viewStorageKey(project.id), mode);
      } catch {
        /* noop */
      }
    },
    [project.id],
  );

  const updatePayLine = useCallback((id: string, updates: Partial<ProjectPayItemView>) => {
    setPayLines((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  }, []);

  const addPayLine = useCallback(
    (draft: { payItemNumber: string; description: string; contractQty: number }) => {
      setPayLines((prev) => [...prev, newTempPayLine(project.id, draft)]);
    },
    [project.id],
  );

  const removePayLine = useCallback((id: string) => {
    setPayLines((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const toggleChecklist = useCallback((key: string) => {
    setChecklist((prev) => {
      const order: ChecklistStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"];
      const cur = prev[key] ?? "NOT_STARTED";
      const next = order[(order.indexOf(cur) + 1) % order.length];
      return { ...prev, [key]: next };
    });
  }, []);

  const initialServerIds = useMemo(
    () => new Set(initialPayLines.filter((r) => !isTempPayLineId(r.id)).map((r) => r.id)),
    [initialPayLines],
  );

  const mergedPhases = useMemo(
    () => mergePhasesWithPayLines(phases, payLines),
    [phases, payLines],
  );

  const hasUnsavedPayLines = useMemo(
    () => payLines.some((row) => isTempPayLineId(row.id)),
    [payLines],
  );

  const projectIdNumeric = Number(project.id);
  const projectIdValid = Number.isInteger(projectIdNumeric) && projectIdNumeric > 0;

  const phasesSaveDisabledReason = !projectIdValid
    ? "Save the project first so it has an id before saving phases."
    : hasUnsavedPayLines
      ? "Save Project first: new contract lines must be stored before phases can reference them."
      : null;

  const handleSavePhases = useCallback(async () => {
    if (!projectIdValid || hasUnsavedPayLines) return;
    setIsSavingPhases(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/phases`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPhasesPutPayload(phases)),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          typeof errorBody.message === "string" ? errorBody.message : "Failed to save phases",
        );
      }
      const data = (await response.json()) as { phases?: ApiProjectPhase[] };
      const next = data.phases ?? [];
      setPhases(mapApiPhasesToWorkspacePhases(next, payLines));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save phases";
      window?.alert?.(message);
    } finally {
      setIsSavingPhases(false);
    }
  }, [hasUnsavedPayLines, project.id, phases, payLines, projectIdValid]);

  const handleSaveProject = async (payload: ProjectFormState) => {
    setIsSaving(true);
    try {
      const projectIdNum = Number(project.id);
      const isCreateMode = !Number.isInteger(projectIdNum) || projectIdNum <= 0;
      const requestUrl = isCreateMode ? "/api/projects" : `/api/projects/${project.id}`;
      const requestMethod = isCreateMode ? "POST" : "PATCH";
      const customerId = Number(company.id);
      const requestBody = isCreateMode
        ? buildProjectPostBodyForSave(payload, checklist, notes, {
            customerId,
            projectType: project.projectType,
          })
        : buildProjectPatchBodyForSave(payload, checklist, notes);

      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          typeof errorBody.message === "string" ? errorBody.message : "Failed to save project",
        );
      }

      if (isCreateMode) {
        const created = (await response.json().catch(() => null)) as { id?: unknown } | null
        const newId =
          created && typeof created === "object" && created.id !== undefined
            ? Number(created.id)
            : NaN
        if (!Number.isInteger(newId) || newId <= 0) {
          throw new Error("Created project did not return a valid id")
        }
        for (const line of payLines) {
          await postProjectPayItemApi({
            project_id: newId,
            pay_item_number: line.payItemNumber,
            pay_item_description: line.payItemDescription?.trim() || undefined,
            pay_item_unit: line.unit?.trim() || undefined,
            contracted_quantity: line.contractedQuantity,
            unit_rate: line.unitRate,
            stockpile_billed: line.stockpileBilled,
            notes: line.notes?.trim() || undefined,
            begin_station: line.beginStation?.trim() || undefined,
            end_station: line.endStation?.trim() || undefined,
            status: line.status?.trim() || undefined,
            locate_ticket: line.locateTicket?.trim() || undefined,
            LF_RT: line.lfRt?.trim() || undefined,
            onsite_review: line.onsiteReview?.trim() || undefined,
            ready_to_work_date: line.readyToWorkDate ?? undefined,
            status_date: line.statusDate ?? undefined,
            surveyed: line.surveyed ?? undefined,
          })
        }
        router.push("/projects");
        return;
      }

      const currentIds = new Set(payLines.filter((r) => !isTempPayLineId(r.id)).map((r) => r.id));
      for (const sid of initialServerIds) {
        if (!currentIds.has(sid)) {
          await deleteProjectPayItemApi(sid);
        }
      }

      for (const line of payLines) {
        if (isTempPayLineId(line.id)) {
          await postProjectPayItemApi({
            project_id: projectIdNum,
            pay_item_number: line.payItemNumber,
            pay_item_description: line.payItemDescription?.trim() || undefined,
            pay_item_unit: line.unit?.trim() || undefined,
            contracted_quantity: line.contractedQuantity,
            unit_rate: line.unitRate,
            stockpile_billed: line.stockpileBilled,
            notes: line.notes?.trim() || undefined,
            begin_station: line.beginStation?.trim() || undefined,
            end_station: line.endStation?.trim() || undefined,
            status: line.status?.trim() || undefined,
            locate_ticket: line.locateTicket?.trim() || undefined,
            LF_RT: line.lfRt?.trim() || undefined,
            onsite_review: line.onsiteReview?.trim() || undefined,
            ready_to_work_date: line.readyToWorkDate ?? undefined,
            status_date: line.statusDate ?? undefined,
            surveyed: line.surveyed ?? undefined,
          });
        } else {
          await patchProjectPayItemApi(line.id, buildProjectPayItemPatchBody(line));
        }
      }

      router.push("/projects");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save project";
      window?.alert?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ProjectHeader
        companyId={company.id}
        companyName={company.name}
        projectCode={project.code}
        projectName={project.name}
        owner={project.owner}
        district={project.district}
        status={PROJECT_STATUS_LABELS[project.status]}
        payApplicationInvoiceNumber={project.payApplicationInvoiceNumber}
        projectManagerId={project.projectManagerId}
        savedBranch={project.branch}
        viewMode={viewMode}
        onChangeView={setViewModePersist}
        onSaveProject={handleSaveProject}
        isSaving={isSaving}
        onPayApplicationInvoiceChange={setLiveInvoiceNumber}
      />

      <PayApplicationWorkspace
        payLines={payLines}
        onUpdatePayLine={updatePayLine}
        onAddPayLine={addPayLine}
        onRemovePayLine={removePayLine}
        checklist={checklist}
        onToggleChecklist={toggleChecklist}
        notes={notes}
        onNotesChange={setNotes}
        viewMode={viewMode}
        phases={mergedPhases}
        onPhasesChange={setPhases}
        onSavePhases={handleSavePhases}
        phasesSaveDisabledReason={phasesSaveDisabledReason}
        isSavingPhases={isSavingPhases}
        invoiceNumber={liveInvoiceNumber}
      />
    </>
  );
}
