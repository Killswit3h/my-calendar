"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import type { PayApplicationView } from "@/components/project/PayApplicationWorkspace";
import type { ProjectFormState } from "@/app/projects/projects.models";
import { cn } from "@/lib/theme";

export type { ProjectFormState } from "@/app/projects/projects.models";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed"] as const;

type ProjectHeaderProps = {
  companyId: string;
  companyName: string;
  projectCode: string;
  projectName: string;
  owner: string;
  district: string;
  status: string;
  payApplicationInvoiceNumber: string;
  viewMode: PayApplicationView;
  onChangeView: (view: PayApplicationView) => void;
  onSaveProject?: (payload: ProjectFormState) => Promise<void> | void;
  isSaving?: boolean;
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
  viewMode,
  onChangeView,
  onSaveProject,
  isSaving = false,
}: ProjectHeaderProps) {
  const [info, setInfo] = useState<ProjectFormState>({
    projectName,
    code: projectCode,
    owner,
    district,
    status,
    payApplicationInvoiceNumber,
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState(projectName);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setInfo({
      projectName,
      code: projectCode,
      owner,
      district,
      status,
      payApplicationInvoiceNumber,
    });
    setEditedProjectName(projectName);
    setIsEditingName(false);
  }, [
    projectName,
    projectCode,
    owner,
    district,
    status,
    payApplicationInvoiceNumber,
    companyId,
    companyName,
  ]);

  const handleSaveProject = async () => {
    if (!onSaveProject) {
      window?.alert?.("Save project is not yet wired to the backend.");
      return;
    }
    const effectiveName = isEditingName
      ? editedProjectName.trim() || info.projectName.trim()
      : info.projectName.trim();
    if (!effectiveName) {
      window?.alert?.("Project name is required.");
      return;
    }
    const payload: ProjectFormState = {
      ...info,
      projectName: effectiveName,
      payApplicationInvoiceNumber: info.payApplicationInvoiceNumber.trim(),
    };
    await onSaveProject(payload);
  };

  const handleExport = () => {
    setIsExporting(true);
    const exportContent = [
      `Project: ${info.code || projectCode} — ${info.projectName}`,
      `Company: ${companyName}`,
      `Owner: ${info.owner}`,
      `District: ${info.district}`,
      `Status: ${info.status}`,
      `Generated: ${new Date().toLocaleString()}`,
    ].join("\n");
    const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${info.code || "project"}-summary.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleProjectNameSave = () => {
    const trimmedName = editedProjectName.trim();
    if (!trimmedName) {
      setEditedProjectName(info.projectName);
      setIsEditingName(false);
      return;
    }
    setInfo((prev) => ({ ...prev, projectName: trimmedName }));
    setIsEditingName(false);
  };

  const detailExtras = [
    info.code?.trim() ? `Code ${info.code.trim()}` : null,
    info.owner?.trim() ? `Owner ${info.owner.trim()}` : null,
    info.district?.trim() ? `District ${info.district.trim()}` : null,
    info.status || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const titleContent = isEditingName ? (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={editedProjectName}
        onChange={(event) => setEditedProjectName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleProjectNameSave();
          }
          if (event.key === "Escape") {
            setEditedProjectName(info.projectName);
            setIsEditingName(false);
          }
        }}
        className="w-64 rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
      />
      <button
        type="button"
        onClick={handleProjectNameSave}
        className="inline-flex items-center rounded-lg bg-[rgba(27,_94,_32,_1)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => {
          setEditedProjectName(info.projectName);
          setIsEditingName(false);
        }}
        className="inline-flex items-center rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
      >
        Cancel
      </button>
    </div>
  ) : (
    info.projectName || "Untitled project"
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
            {detailExtras ? <span className="text-white/60">· {detailExtras}</span> : null}
          </span>
        }
        auxiliary={
          <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-3 py-2">
            <span className="text-xs font-semibold text-white/70">INV#</span>
            <input
              type="text"
              value={info.payApplicationInvoiceNumber}
              onChange={(event) =>
                setInfo((prev) => ({ ...prev, payApplicationInvoiceNumber: event.target.value }))
              }
              placeholder="Enter invoice #"
              className="w-28 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
            />
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
                Phases
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditedProjectName(info.projectName);
                setIsEditingName(true);
              }}
              className="inline-flex items-center rounded-lg bg-[rgba(18,115,24,1)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              Edit Project
            </button>
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

      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white sm:px-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Project details</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/60">Code</span>
            <input
              value={info.code}
              onChange={(e) => setInfo((p) => ({ ...p, code: e.target.value }))}
              placeholder="Project code"
              className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white placeholder:text-white/35 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/60">Owner</span>
            <input
              value={info.owner}
              onChange={(e) => setInfo((p) => ({ ...p, owner: e.target.value }))}
              placeholder="Owner"
              className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white placeholder:text-white/35 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/60">District</span>
            <input
              value={info.district}
              onChange={(e) => setInfo((p) => ({ ...p, district: e.target.value }))}
              placeholder="District"
              className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white placeholder:text-white/35 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/60">Status</span>
            <select
              value={info.status}
              onChange={(e) => setInfo((p) => ({ ...p, status: e.target.value }))}
              className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
