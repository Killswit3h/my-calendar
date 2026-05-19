"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import type { PayApplicationView } from "@/components/project/PayApplicationWorkspace";
import type { ProjectFormState } from "@/app/projects/projects.models";
import { PROJECT_BRANCH_VALUES } from "@/app/projects/projectBranchOptions";
import { PROJECT_MANAGER_ROLE } from "@/domain/projectEmployees";
import { cn } from "@/lib/theme";

export type { ProjectFormState } from "@/app/projects/projects.models";

type PmEmployeeRow = {
  id: number;
  name: string;
};

type ProjectHeaderProps = {
  companyId: string;
  companyName: string;
  projectCode: string;
  projectName: string;
  owner: string;
  district: string;
  status: string;
  payApplicationInvoiceNumber: string;
  projectManagerId: number | null;
  savedBranch: string | null;
  viewMode: PayApplicationView;
  onChangeView: (view: PayApplicationView) => void;
  onSaveProject?: (payload: ProjectFormState) => Promise<void> | void;
  isSaving?: boolean;
  onPayApplicationInvoiceChange?: (value: string) => void;
};

export function ProjectHeader({
  companyId,
  companyName,
  projectCode,
  projectName,
  owner,
  district,
  status,
  payApplicationInvoiceNumber,
  projectManagerId,
  savedBranch,
  viewMode,
  onChangeView,
  onSaveProject,
  isSaving = false,
  onPayApplicationInvoiceChange,
}: ProjectHeaderProps) {
  const [info, setInfo] = useState<ProjectFormState>({
    projectName,
    code: projectCode,
    owner,
    district,
    status,
    payApplicationInvoiceNumber,
    projectManagerId:
      typeof projectManagerId === "number" && Number.isInteger(projectManagerId)
        ? projectManagerId
        : null,
    branch: typeof savedBranch === "string" && savedBranch.trim() ? savedBranch : "",
  });
  const [nameValue, setNameValue] = useState(projectName);
  const [committedName, setCommittedName] = useState(projectName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [projectManager, setProjectManager] = useState("");
  const [branch, setBranch] = useState("");
  const [pmOptions, setPmOptions] = useState<PmEmployeeRow[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const branchVal =
      typeof savedBranch === "string" && savedBranch.trim()
        ? savedBranch
        : "";
    const pmVal =
      typeof projectManagerId === "number" && Number.isInteger(projectManagerId)
        ? projectManagerId
        : null;
    setInfo({
      projectName,
      code: projectCode,
      owner,
      district,
      status,
      payApplicationInvoiceNumber,
      projectManagerId: pmVal,
      branch: branchVal,
    });
    const pmSel = pmVal != null ? String(pmVal) : "";
    setProjectManager(pmSel);
    setBranch(branchVal);
    setNameValue(projectName);
    setCommittedName(projectName);
    setIsEditingName(false);
  }, [
    projectName,
    projectCode,
    owner,
    district,
    status,
    payApplicationInvoiceNumber,
    projectManagerId,
    savedBranch,
    companyId,
    companyName,
  ]);

  useEffect(() => {
    let cancelled = false;
    const loadManagers = async () => {
      try {
        const q = new URLSearchParams({
          active: "true",
          role: PROJECT_MANAGER_ROLE,
        });
        const res = await fetch(`/api/employees?${q.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const rows = (await res.json()) as unknown;
        if (!Array.isArray(rows) || cancelled) return;
        const next: PmEmployeeRow[] = rows
          .map((row) =>
            row && typeof row === "object"
              ? {
                  id: Number((row as { id?: unknown }).id),
                  name: String((row as { name?: unknown }).name ?? ""),
                }
              : null,
          )
          .filter((r): r is PmEmployeeRow => !!r && Number.isFinite(r.id) && r.name.length > 0);
        next.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setPmOptions(next);
      } catch {
        /* network */
      }
    };
    void loadManagers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  const commitName = () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameValue(committedName);
    } else {
      setCommittedName(trimmed);
      setNameValue(trimmed);
      setInfo((prev) => ({ ...prev, projectName: trimmed }));
    }
    setIsEditingName(false);
  };

  const handleSaveProject = async () => {
    if (!onSaveProject) {
      window?.alert?.("Save project is not yet wired to the backend.");
      return;
    }
    const effectiveName = committedName.trim() || info.projectName.trim();
    if (!effectiveName) {
      window?.alert?.("Project name is required.");
      return;
    }
    const resolvedPm =
      projectManager.trim() !== "" && /^\d+$/.test(projectManager.trim())
        ? Number(projectManager.trim())
        : null;
    const payload: ProjectFormState = {
      ...info,
      projectName: effectiveName,
      payApplicationInvoiceNumber: info.payApplicationInvoiceNumber.trim(),
      projectManagerId: resolvedPm,
      branch,
    };
    await onSaveProject(payload);
  };

  const handleExport = () => {
    setIsExporting(true);
    const exportContent = [
      `Project: ${info.code || projectCode} — ${committedName}`,
      `Company: ${companyName}`,
      `Owner: ${info.owner}`,
      `District: ${info.district}`,
      `Status: ${info.status}`,
      `Generated: ${new Date().toLocaleString()}`,
    ].join("\n");
    const blob = new Blob([exportContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${info.code || "project"}-summary.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setIsExporting(false), 1000);
  };

  const titleContent = isEditingName ? (
    <input
      ref={nameInputRef}
      type="text"
      value={nameValue}
      onChange={(e) => setNameValue(e.target.value)}
      onBlur={commitName}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          nameInputRef.current?.blur();
        }
        if (e.key === "Escape") {
          setNameValue(committedName);
          setIsEditingName(false);
        }
      }}
      aria-label="Project name"
      className={cn(
        "min-w-[160px] max-w-[480px] w-auto",
        "bg-transparent border-none outline-none ring-0 p-0 m-0",
        "text-2xl font-semibold tracking-tight sm:text-[30px] text-white",
        "appearance-none",
      )}
      style={{ boxShadow: "none" }}
      size={Math.max(nameValue.length, 10)}
    />
  ) : (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setIsEditingName(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditingName(true);
        }
      }}
      className="cursor-text select-text text-2xl font-semibold tracking-tight sm:text-[30px] text-white outline-none"
    >
      {committedName || "Untitled project"}
    </span>
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title={titleContent}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-1">
            <Link
              href={`/projects/${companyId}`}
              className="font-medium text-white/85 underline-offset-2 hover:text-white hover:underline"
            >
              {companyName || "Company"}
            </Link>
          </span>
        }
        auxiliary={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-3 py-2">
              <span className="text-xs font-semibold text-white/70">INV#</span>
              <input
                type="text"
                value={info.payApplicationInvoiceNumber}
                onChange={(event) => {
                  const next = event.target.value;
                  setInfo((prev) => ({
                    ...prev,
                    payApplicationInvoiceNumber: next,
                  }));
                  onPayApplicationInvoiceChange?.(next);
                }}
                placeholder="Enter invoice #"
                className="w-28 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-3 py-2">
              <span className="text-xs font-semibold text-white/70">PM</span>
              <select
                value={projectManager}
                onChange={(event) => {
                  const v = event.target.value;
                  setProjectManager(v);
                  setInfo((prev) => ({
                    ...prev,
                    projectManagerId:
                      v.trim() !== "" && /^\d+$/.test(v.trim())
                        ? Number(v.trim())
                        : null,
                  }));
                }}
                aria-label="Project manager"
                className="rounded-md border border-white/20 bg-black/30 px-2 py-1 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              >
                <option value="" className="bg-neutral-900 text-white">
                  Select PM
                </option>
                {pmOptions.map((pm) => (
                  <option
                    key={pm.id}
                    value={String(pm.id)}
                    className="bg-neutral-900 text-white"
                  >
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-3 py-2">
              <span className="text-xs font-semibold text-white/70">
                Branch
              </span>
              <select
                value={branch}
                onChange={(event) => {
                  const v = event.target.value;
                  setBranch(v);
                  setInfo((prev) => ({ ...prev, branch: v }));
                }}
                aria-label="Branch"
                className="rounded-md border border-white/20 bg-black/30 px-2 py-1 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              >
                <option value="" className="bg-neutral-900 text-white">
                  Select branch
                </option>
                {PROJECT_BRANCH_VALUES.map((b) => (
                  <option
                    key={b}
                    value={b}
                    className="bg-neutral-900 text-white"
                  >
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => onChangeView("contract")}
                aria-pressed={viewMode === "contract"}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                  viewMode === "contract"
                    ? "bg-white/80 text-black"
                    : "text-white/80 hover:bg-white/10",
                )}
              >
                Contract
              </button>
              <button
                type="button"
                onClick={() => onChangeView("phases")}
                aria-pressed={viewMode === "phases"}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                  viewMode === "phases"
                    ? "bg-white/80 text-black"
                    : "text-white/80 hover:bg-white/10",
                )}
              >
                Invoices
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveProject}
              disabled={isSaving}
              className="inline-flex items-center rounded-lg bg-[rgba(18,115,24,1)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              {isSaving ? "Saving..." : "Save Project"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 disabled:opacity-60"
            >
              {isExporting ? "Exporting…" : "Export Summary"}
            </button>
          </div>
        }
      />
    </div>
  );
}
