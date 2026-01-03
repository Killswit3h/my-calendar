"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Company } from "@/lib/mock/projects";

type Props = {
  companies: Company[];
};

export function NewProjectLauncher({ companies }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const filteredCompanies = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) => company.name.toLowerCase().includes(term));
  }, [companies, query]);

  useEffect(() => {
    if (!selectedCompanyId && filteredCompanies.length) {
      setSelectedCompanyId(filteredCompanies[0].id);
    }
    if (selectedCompanyId && filteredCompanies.every((c) => c.id !== selectedCompanyId)) {
      setSelectedCompanyId(filteredCompanies[0]?.id ?? "");
    }
  }, [filteredCompanies, selectedCompanyId]);

  const handleCreate = () => {
    if (!selectedCompanyId) return;
    const url = `/projects/new?companyId=${encodeURIComponent(selectedCompanyId)}`;
    setIsOpen(false);
    router.push(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--fc-border-color)] shadow hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        New project
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 text-white shadow-xl">
            <header className="space-y-1">
              <h3 className="text-lg font-semibold">Select company</h3>
              <p className="text-sm text-white/60">Choose where to create the new project.</p>
            </header>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/60">Company</label>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search companies…"
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              />
              <select
                value={selectedCompanyId}
                onChange={(event) => setSelectedCompanyId(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              >
                {filteredCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
                {!filteredCompanies.length ? <option value="">No matches</option> : null}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center rounded-lg bg-[rgba(18,115,24,1)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


