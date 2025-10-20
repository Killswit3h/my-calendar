"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  List,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "SUBSTANTIAL" | "CLOSED";
type Priority = "HIGH" | "MEDIUM" | "LOW";

type Project = {
  id: string;
  name: string;
  client: string;
  location: string;
  status: ProjectStatus;
  priority: Priority;
  start: string;
  finish?: string;
  superintendent?: string;
  crews?: string[];
  percentComplete: number;
  budgetPlanned: number;
  committed: number;
  spent: number;
  nextMilestone?: { title: string; due: string };
  summaryNote?: string;
};

const initialProjects: Project[] = [
  {
    id: "proj-guardrail-i95",
    name: "I-95 Guardrail Rehabilitation",
    client: "FDOT District 6",
    location: "Miami, FL",
    status: "ACTIVE",
    priority: "HIGH",
    start: "2024-07-08",
    finish: "2025-02-15",
    superintendent: "Maria Torres",
    crews: ["Guardrail Crew A", "Night Shift"],
    percentComplete: 58,
    budgetPlanned: 2200000,
    committed: 1815000,
    spent: 1465000,
    nextMilestone: { title: "Install Segment 4 guardrail panels", due: "2024-11-05" },
    summaryNote: "Night closures approved through December; pacing aligns with revised CPM.",
  },
  {
    id: "proj-royal-palms-fence",
    name: "Royal Palms Resort Perimeter Fence",
    client: "Royal Palms Hospitality",
    location: "Fort Lauderdale, FL",
    status: "PLANNING",
    priority: "MEDIUM",
    start: "2024-10-01",
    finish: "2025-01-20",
    superintendent: "Andre Silva",
    crews: ["Fence Crew South"],
    percentComplete: 18,
    budgetPlanned: 860000,
    committed: 340000,
    spent: 95000,
    nextMilestone: { title: "Submit shop drawings for ornamental panels", due: "2024-10-18" },
    summaryNote: "Awaiting final material approval from architect; procurement lead time flagged.",
  },
  {
    id: "proj-south-creek-campus",
    name: "South Creek School Safety Upgrades",
    client: "Broward County Schools",
    location: "Pembroke Pines, FL",
    status: "SUBSTANTIAL",
    priority: "HIGH",
    start: "2024-02-05",
    finish: "2024-09-30",
    superintendent: "Kimberly Rhodes",
    crews: ["Fence Crew North", "Service Crew"],
    percentComplete: 92,
    budgetPlanned: 1480000,
    committed: 1402000,
    spent: 1327500,
    nextMilestone: { title: "Punch-walk with Facilities", due: "2024-10-03" },
    summaryNote: "Punch tracking issued; remaining items include access control and signage.",
  },
];

const STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  SUBSTANTIAL: "Substantial Completion",
  CLOSED: "Closed",
};

const STATUS_TONE: Record<ProjectStatus, string> = {
  PLANNING: "bg-sky-500/15 text-sky-300",
  ACTIVE: "bg-emerald-500/15 text-emerald-300",
  ON_HOLD: "bg-amber-500/15 text-amber-300",
  SUBSTANTIAL: "bg-indigo-500/15 text-indigo-300",
  CLOSED: "bg-zinc-500/20 text-zinc-200",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const onCreateProject = (project: Partial<Project>) => {
  console.log("projects:create", project);
};

const onUpdateStatus = (ids: string[], status: ProjectStatus) => {
  console.log("projects:set-status", { ids, status });
};

const onAssignCrew = (ids: string[], crew: string) => {
  console.log("projects:assign-crew", { ids, crew });
};

const onCreateEvent = (ids: string[]) => {
  console.log("projects:create-event", { ids });
};

const onCreatePickTicket = (ids: string[]) => {
  console.log("projects:create-pick-ticket", { ids });
};

export default function ProjectsIndexPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selected, setSelected] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "ALL">("ALL");
  const [superFilter, setSuperFilter] = useState<string>("ALL");
  const [bulkStatus, setBulkStatus] = useState<ProjectStatus>("ACTIVE");
  const [bulkCrew, setBulkCrew] = useState<string>("Guardrail Crew A");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !search ||
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.client.toLowerCase().includes(search.toLowerCase()) ||
        project.location.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || project.priority === priorityFilter;
      const matchesSuper = superFilter === "ALL" || project.superintendent === superFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesSuper;
    });
  }, [projects, search, statusFilter, priorityFilter, superFilter]);

  const superintendentOptions = useMemo(() => {
    const uniq = new Set(projects.map((proj) => proj.superintendent).filter(Boolean) as string[]);
    return Array.from(uniq);
  }, [projects]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelected(checked ? filteredProjects.map((project) => project.id) : []);
  };

  const handleBulkStatus = () => {
    if (!selected.length) return;
    onUpdateStatus(selected, bulkStatus);
    setProjects((prev) =>
      prev.map((project) =>
        selected.includes(project.id) ? { ...project, status: bulkStatus } : project,
      ),
    );
  };

  const handleBulkAssignCrew = () => {
    if (!selected.length) return;
    onAssignCrew(selected, bulkCrew);
    setProjects((prev) =>
      prev.map((project) =>
        selected.includes(project.id)
          ? {
              ...project,
              crews: Array.from(new Set([...(project.crews ?? []), bulkCrew])),
            }
          : project,
      ),
    );
  };

  const handleCreateEvent = () => {
    if (!selected.length) return;
    onCreateEvent(selected);
    window.alert(`Calendar event drafted for ${selected.length} project(s).`);
  };

  const handleCreateTicket = () => {
    if (!selected.length) return;
    onCreatePickTicket(selected);
    window.alert(`Pick ticket queued for ${selected.length} project(s).`);
  };

  const card = (project: Project) => {
    const { id, percentComplete, summaryNote, nextMilestone } = project;
    const statusTone = STATUS_TONE[project.status];
    return (
      <Card
        key={id}
        tone="glass"
        className="flex h-full flex-col border border-border/50 transition hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/projects/${id}`}
              className="text-lg font-semibold text-white hover:text-accent transition"
            >
              {project.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-4 w-4 text-accent" />
                {project.client}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-accent" />
                {project.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4 text-accent" />
                {project.superintendent ?? "TBD"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <Badge className={statusTone}>{STATUS_LABEL[project.status]}</Badge>
            <div className="mt-1 text-xs uppercase tracking-wide text-muted">
              Priority {PRIORITY_LABEL[project.priority]}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-muted">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-muted">Schedule</div>
              <div className="mt-1 inline-flex items-center gap-2 text-sm text-white">
                <CalendarDays className="h-4 w-4 text-accent" />
                {project.start} → {project.finish ?? "TBD"}
              </div>
              {nextMilestone ? (
                <div className="mt-2 text-xs text-muted">
                  Next: <span className="text-white/80">{nextMilestone.title}</span> ·{" "}
                  {nextMilestone.due}
                </div>
              ) : null}
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-muted">Financials</div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted">
                <span className="text-white/70">Budget</span>
                <span className="text-right text-white/90">
                  {formatCurrency(project.budgetPlanned)}
                </span>
                <span className="text-white/70">Committed</span>
                <span className="text-right text-white/90">
                  {formatCurrency(project.committed)}
                </span>
                <span className="text-white/70">Spent</span>
                <span className="text-right text-white/90">
                  {formatCurrency(project.spent)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted">
              <span>Progress</span>
              <span className="text-white/80">{percentComplete}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent/80 transition-all"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {summaryNote ? (
            <p className="rounded-xl bg-foreground/5 px-3 py-2 text-xs leading-relaxed text-muted">
              {summaryNote}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
          <span>{project.crews?.join(" • ") || "No crews assigned yet"}</span>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-4 rounded border border-border bg-transparent accent-accent"
              checked={selected.includes(id)}
              onChange={() => toggleSelect(id)}
            />
            Select
          </label>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="text-sm text-muted">
            Monitor active guardrail and fence work, keep stakeholders aligned, and act quickly.
          </p>
        </div>
        <Button
          onClick={() => {
            onCreateProject({});
            window.alert("Project creation wizard coming soon.");
          }}
        >
          New Project
        </Button>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface-soft px-4 py-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="Search by name, client, or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:max-w-md"
            />
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              className="hidden items-center gap-2 md:inline-flex"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              className="hidden items-center gap-2 md:inline-flex"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
              Table
            </Button>
          </div>
          <div className="grid gap-2 md:grid-cols-3 md:gap-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProjectStatus | "ALL")}
            >
              <option value="ALL">All statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="SUBSTANTIAL">Substantial</option>
              <option value="CLOSED">Closed</option>
            </Select>
            <Select
              label="Priority"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as Priority | "ALL")}
            >
              <option value="ALL">All priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
            <Select
              label="Superintendent"
              value={superFilter}
              onChange={(event) => setSuperFilter(event.target.value)}
            >
              <option value="ALL">All supers</option>
              {superintendentOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted">
          <div className="inline-flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span>{filteredProjects.length} project(s) shown</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-accent" />
            <span>
              {formatCurrency(
                filteredProjects.reduce((sum, project) => sum + project.budgetPlanned, 0),
              )}{" "}
              planned value
            </span>
          </div>
        </div>
      </div>

      {selected.length ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-accent/40 bg-accent/5 px-4 py-4 shadow-card md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <ClipboardList className="h-4 w-4 text-accent" />
            <span>
              {selected.length} project{selected.length === 1 ? "" : "s"} selected
            </span>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-3 md:justify-end">
            <Select
              label="Status"
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value as ProjectStatus)}
              className="w-44"
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="SUBSTANTIAL">Substantial</option>
              <option value="CLOSED">Closed</option>
            </Select>
            <Button variant="outline" onClick={handleBulkStatus}>
              Set Status
            </Button>
            <Select
              label="Crew"
              value={bulkCrew}
              onChange={(event) => setBulkCrew(event.target.value)}
              className="w-48"
            >
              <option value="Guardrail Crew A">Guardrail Crew A</option>
              <option value="Guardrail Crew B">Guardrail Crew B</option>
              <option value="Fence Crew South">Fence Crew South</option>
              <option value="Fence Crew North">Fence Crew North</option>
            </Select>
            <Button variant="outline" onClick={handleBulkAssignCrew}>
              Assign Crew
            </Button>
            <Button variant="outline" onClick={handleCreateEvent}>
              Create Calendar Event
            </Button>
            <Button onClick={handleCreateTicket}>Create Pick Ticket</Button>
          </div>
        </div>
      ) : null}

      {viewMode === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map(card)}
        </div>
      ) : (
        <Card tone="glass" padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm text-muted">
            <div className="inline-flex items-center gap-2">
              <List className="h-4 w-4 text-accent" />
              Table view
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                className="size-4 rounded border border-border bg-transparent accent-accent"
                checked={
                  filteredProjects.length > 0 &&
                  selected.length === filteredProjects.length
                }
                onChange={(event) => toggleSelectAll(event.target.checked)}
              />
              Select all
            </label>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Superintendent</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>% Complete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow
                  key={project.id}
                  className={selected.includes(project.id) ? "bg-accent/5" : undefined}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="size-4 rounded border border-border bg-transparent accent-accent"
                      checked={selected.includes(project.id)}
                      onChange={() => toggleSelect(project.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-white hover:text-accent"
                    >
                      {project.name}
                    </Link>
                    <div className="text-xs text-muted">{project.client}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_TONE[project.status]}>
                      {STATUS_LABEL[project.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{PRIORITY_LABEL[project.priority]}</TableCell>
                  <TableCell>{project.superintendent ?? "TBD"}</TableCell>
                  <TableCell>
                    {project.start} → {project.finish ?? "TBD"}
                  </TableCell>
                  <TableCell>{formatCurrency(project.budgetPlanned)}</TableCell>
                  <TableCell>{project.percentComplete}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
