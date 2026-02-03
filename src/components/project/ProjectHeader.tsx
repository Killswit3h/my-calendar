"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import type { PayApplicationView } from "@/components/project/PayApplicationWorkspace";
import { cn } from "@/lib/theme";

type ProjectHeaderProps = {
  companyId: string;
  companyName: string;
  projectCode: string;
  projectName: string;
  owner: string;
  district: string;
  status: string;
  viewMode: PayApplicationView;
  onChangeView: (view: PayApplicationView) => void;
};

type ProjectFormState = {
  projectName: string;
  owner: string;
  district: string;
  status: string;
};

export function ProjectHeader({
  companyId,
  companyName,
  projectCode,
  projectName,
  owner,
  district,
  status,
  viewMode,
  onChangeView,
}: ProjectHeaderProps) {
  const [info, setInfo] = useState<ProjectFormState>({ projectName, owner, district, status });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState(projectName);
  const [isExporting, setIsExporting] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const handleSaveProject = () => {
    // Placeholder for save-to-API wiring
    window?.alert?.("Save project is not yet wired to the backend.");
  };

  const handleExport = () => {
    setIsExporting(true);
    const exportContent = [
      `Project: ${projectCode} — ${info.projectName}`,
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
    anchor.download = `${projectCode}-summary.txt`;
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
    info.projectName
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title={titleContent}
        auxiliary={
          <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-3 py-2">
            <span className="text-xs font-semibold text-white/70">INV#</span>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
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
              className="inline-flex items-center rounded-lg bg-[rgba(18,115,24,1)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              Save Project
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

