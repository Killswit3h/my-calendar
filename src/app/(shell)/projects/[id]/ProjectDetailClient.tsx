"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  MapPin,
  Plus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  ProjectDetailData,
  Project,
  Milestone,
  Task,
  TaskLane,
  ProjectStatus,
  BudgetLine,
  RFI,
  ChangeOrder,
  Risk,
} from "./page";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  SUBSTANTIAL: "Substantial",
  CLOSED: "Closed",
};

const STATUS_TONE: Record<ProjectStatus, string> = {
  PLANNING: "bg-sky-500/15 text-sky-200",
  ACTIVE: "bg-emerald-500/15 text-emerald-200",
  ON_HOLD: "bg-amber-500/15 text-amber-200",
  SUBSTANTIAL: "bg-indigo-500/15 text-indigo-200",
  CLOSED: "bg-zinc-500/20 text-zinc-200",
};

const PRIORITY_LABEL = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

const onUpdateStatus = (projectId: string, status: ProjectStatus) => {
  console.log("project-detail:set-status", { projectId, status });
};

const onAssignCrew = (projectId: string, crew: string) => {
  console.log("project-detail:assign-crew", { projectId, crew });
};

const onCreateEvent = (projectId: string) => {
  console.log("project-detail:create-event", { projectId });
};

const onCreatePickTicket = (projectId: string) => {
  console.log("project-detail:create-pick-ticket", { projectId });
};

const onAddMilestone = (projectId: string, milestone: Partial<Milestone>) => {
  console.log("project-detail:add-milestone", { projectId, milestone });
};

const onUpdateMilestone = (projectId: string, milestone: Milestone) => {
  console.log("project-detail:update-milestone", { projectId, milestone });
};

const onAddTask = (projectId: string, task: Partial<Task>) => {
  console.log("project-detail:add-task", { projectId, task });
};

const onMoveTask = (projectId: string, taskId: string, lane: TaskLane) => {
  console.log("project-detail:move-task", { projectId, taskId, lane });
};

const onCompleteTask = (projectId: string, taskId: string) => {
  console.log("project-detail:complete-task", { projectId, taskId });
};

const onAddBudgetLine = (projectId: string, line: Partial<BudgetLine>) => {
  console.log("project-detail:add-budget", { projectId, line });
};

const onEditBudgetLine = (projectId: string, line: BudgetLine) => {
  console.log("project-detail:edit-budget", { projectId, line });
};

const onAddRFI = (projectId: string, rfi: Partial<RFI>) => {
  console.log("project-detail:add-rfi", { projectId, rfi });
};

const onAddCO = (projectId: string, co: Partial<ChangeOrder>) => {
  console.log("project-detail:add-co", { projectId, co });
};

const onSetRisk = (projectId: string, risk: Partial<Risk>) => {
  console.log("project-detail:set-risk", { projectId, risk });
};

const onGenerateSnapshot = (projectId: string) => {
  console.log("project-detail:generate-snapshot", { projectId });
};

const onGenerateWeekly = (projectId: string) => {
  console.log("project-detail:generate-weekly", { projectId });
};

const formatCurrency = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  }).format(value);

function severityClass(prob: number, impact: number) {
  const score = prob * impact;
  if (score >= 20) return "bg-red-500/20 text-red-200";
  if (score >= 12) return "bg-orange-500/20 text-orange-200";
  if (score >= 8) return "bg-amber-500/20 text-amber-200";
  return "bg-emerald-500/15 text-emerald-200";
}

function isDueSoon(date: string) {
  const due = new Date(date);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return diff >= 0 && diff <= sevenDays;
}

type Props = {
  data: ProjectDetailData;
};

export default function ProjectDetailClient({ data }: Props) {
  const {
    project: initialProject,
    milestones: initialMilestones,
    tasks: initialTasks,
    budget: initialBudget,
    rfis: initialRFIs,
    changeOrders: initialCOs,
    risks: initialRisks,
    statusHistory,
    contacts,
    inventory,
  } = data;

  const [project, setProject] = useState<Project>(initialProject);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const budget = initialBudget;
  const rfis = initialRFIs;
  const changeOrders = initialCOs;
  const [risks, setRisks] = useState<Risk[]>(initialRisks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const projectId = project.id;

  const totals = useMemo(() => {
    const planned = budget.reduce((sum, line) => sum + line.planned, 0);
    const committed = budget.reduce((sum, line) => sum + line.committed, 0);
    const spent = budget.reduce((sum, line) => sum + line.spent, 0);
    return { planned, committed, spent, variance: planned - spent };
  }, [budget]);

  const overdueMilestones = milestones.filter((milestone) => {
    const due = new Date(milestone.due);
    return milestone.percent < 100 && due.getTime() < Date.now();
  });

  const upcomingMilestones = milestones
    .filter((milestone) => milestone.percent < 100)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 3);

  const nextSevenMilestones = milestones.filter((milestone) => isDueSoon(milestone.due));

  const lanes: { key: TaskLane; title: string }[] = [
    { key: "BACKLOG", title: "Backlog" },
    { key: "READY", title: "Ready" },
    { key: "DOING", title: "Doing" },
    { key: "BLOCKED", title: "Blocked" },
    { key: "DONE", title: "Done" },
  ];

  const handleStatusChange = (value: ProjectStatus) => {
    onUpdateStatus(projectId, value);
    setProject((prev) => ({ ...prev, status: value }));
  };

  const handleCrewAdd = (crew: string) => {
    if (!crew.trim()) return;
    onAssignCrew(projectId, crew);
    setProject((prev) => ({
      ...prev,
      crews: Array.from(new Set([...(prev.crews ?? []), crew])),
    }));
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId,
      title: newTaskTitle.trim(),
      lane: "BACKLOG",
    };
    onAddTask(projectId, newTask);
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");
  };

  const updateTaskLane = (taskId: string, lane: TaskLane) => {
    onMoveTask(projectId, taskId, lane);
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, lane } : task)),
    );
  };

  const completeTask = (taskId: string) => {
    onCompleteTask(projectId, taskId);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, lane: "DONE" } : task,
      ),
    );
  };

  const addMilestone = (title: string, due: string) => {
    if (!title.trim() || !due) return;
    const newMilestone: Milestone = {
      id: `ms-${Date.now()}`,
      projectId,
      title: title.trim(),
      due,
      percent: 0,
    };
    onAddMilestone(projectId, newMilestone);
    setMilestones((prev) => [...prev, newMilestone]);
  };

  const updateMilestonePercent = (milestoneId: string, percent: number) => {
    setMilestones((prev) =>
      prev.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, percent } : milestone,
      ),
    );
    const milestone = milestones.find((entry) => entry.id === milestoneId);
    if (milestone) {
      onUpdateMilestone(projectId, { ...milestone, percent });
    }
  };

  const addRisk = (title: string) => {
    if (!title.trim()) return;
    const newRisk: Risk = {
      id: `risk-${Date.now()}`,
      projectId,
      title: title.trim(),
      probability: 3,
      impact: 3,
      owner: project.superintendent,
    };
    onSetRisk(projectId, newRisk);
    setRisks((prev) => [...prev, newRisk]);
  };

  const snapshotCard = (
    <Card
      tone="glass"
      className="mt-6 border border-border/60 bg-surface-soft/90 shadow-lg print:border print:shadow-none"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Project Snapshot</h2>
          <p className="text-sm text-muted">
            Pull-ready summary for leadership and owner reporting.
          </p>
        </div>
        <div className="text-right text-sm text-muted">
          Generated{" "}
          {new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date())}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-foreground/5 p-3 text-sm text-muted">
          <div className="text-xs uppercase tracking-wide text-muted">Client</div>
          <div className="text-white/90">{project.client}</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-foreground/5 p-3 text-sm text-muted">
          <div className="text-xs uppercase tracking-wide text-muted">Location</div>
          <div className="text-white/90">{project.location}</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-foreground/5 p-3 text-sm text-muted">
          <div className="text-xs uppercase tracking-wide text-muted">Superintendent</div>
          <div className="text-white/90">{project.superintendent ?? "TBD"}</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-foreground/5 p-3 text-sm text-muted">
          <div className="text-xs uppercase tracking-wide text-muted">Schedule</div>
          <div className="text-white/90">
            {project.start} → {project.finish ?? "TBD"}
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-foreground/5 p-3 text-sm text-muted">
          <div className="text-xs uppercase tracking-wide text-muted">Status</div>
          <Badge className={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Badge>
        </div>
        <div className="rounded-xl border border-border/50 bg-foreground/5 p-3 text-sm text-muted">
          <div className="text-xs uppercase tracking-wide text-muted">% Complete</div>
          <div className="mt-1 flex items-center gap-2 text-white">
            <div className="h-2 flex-1 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${project.percentComplete}%` }}
              />
            </div>
            <span>{project.percentComplete}%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-muted">Budget vs Spent</div>
          <div className="mt-2 text-sm text-muted">
            <div className="flex items-center justify-between">
              <span>Planned</span>
              <span className="text-white/90">{formatCurrency(totals.planned)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Spent</span>
              <span className="text-white/90">{formatCurrency(totals.spent)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Variance</span>
              <span className="text-white/90">{formatCurrency(totals.variance)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-muted">Upcoming milestones</div>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            {upcomingMilestones.map((milestone) => (
              <li key={milestone.id} className="flex items-center justify-between">
                <span className="text-white/80">{milestone.title}</span>
                <span className="text-muted">{milestone.due}</span>
              </li>
            ))}
            {!upcomingMilestones.length ? (
              <li className="text-xs text-muted">All milestones complete.</li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-xl border border-border/50 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-muted">Top risks</div>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            {risks
              .slice()
              .sort((a, b) => b.probability * b.impact - a.probability * a.impact)
              .slice(0, 3)
              .map((risk) => (
                <li key={risk.id} className="rounded-lg border border-border/40 bg-foreground/5 px-3 py-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
                    <span>Severity {risk.probability * risk.impact}</span>
                    <span>{risk.owner ?? "TBD"}</span>
                  </div>
                  <div className="text-white/80">{risk.title}</div>
                </li>
              ))}
            {!risks.length ? (
              <li className="rounded-lg border border-border/40 bg-foreground/5 px-3 py-2 text-xs text-muted">
                No risks logged.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border/50 bg-white/5 p-4">
        <div className="text-xs uppercase tracking-wide text-muted">Open tasks</div>
        <ul className="mt-2 space-y-2 text-sm text-muted">
          {tasks
            .filter((task) => task.lane !== "DONE")
            .slice(0, 5)
            .map((task) => (
              <li key={task.id} className="flex items-center justify-between">
                <span className="text-white/80">{task.title}</span>
                <span className="text-xs text-muted">
                  {task.due ? `Due ${task.due}` : task.lane}
                </span>
              </li>
            ))}
          {!tasks.filter((task) => task.lane !== "DONE").length ? (
            <li className="text-xs text-muted">All tasks completed.</li>
          ) : null}
        </ul>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <Link href="/projects" className="text-sm text-muted hover:text-accent">
            ← Back to Projects
          </Link>
          <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              {project.location}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              Superintendent {project.superintendent ?? "TBD"}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent" />
              {project.start} → {project.finish ?? "TBD"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <Badge className={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Badge>
          <Badge variant="secondary">Priority {PRIORITY_LABEL[project.priority]}</Badge>
          <Select
            label="Update Status"
            value={project.status}
            onChange={(event) => handleStatusChange(event.target.value as ProjectStatus)}
            className="w-48"
          >
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="SUBSTANTIAL">Substantial</option>
            <option value="CLOSED">Closed</option>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              onCreateEvent(projectId);
              window.alert("Calendar event draft created.");
            }}
          >
            Schedule Activity
          </Button>
          <Button
            onClick={() => {
              onCreatePickTicket(projectId);
              window.alert("Pick ticket assembled.");
            }}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Create Pick Ticket
          </Button>
        </div>
      </header>

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="people">People & Assets</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card tone="glass" className="lg:col-span-2 border border-border/60">
              <div className="space-y-4 text-sm text-muted">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted">
                      Budget performance
                    </div>
                    <div className="mt-2 grid gap-2 text-sm text-white">
                      <div className="flex items-center justify-between">
                        <span>Planned</span>
                        <span>{formatCurrency(totals.planned)}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/80">
                        <span>Committed</span>
                        <span>{formatCurrency(totals.committed)}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/80">
                        <span>Spent</span>
                        <span>{formatCurrency(totals.spent)}</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-200">
                        <span>Variance</span>
                        <span>{formatCurrency(totals.variance)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted">
                      Crews & resources
                    </div>
                    <div className="mt-2 space-y-2 text-sm text-white/80">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted">Crews</div>
                        <div>{project.crews?.join(", ") || "None assigned"}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add crew..."
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              const value = (event.target as HTMLInputElement).value;
                              handleCrewAdd(value);
                              (event.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            const value = window.prompt("Crew name");
                            if (value) handleCrewAdd(value);
                          }}
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
                    <span>Status timeline</span>
                    <span className="text-muted">
                      Latest update: {statusHistory.at(-1)?.at ?? "—"}
                    </span>
                  </div>
                  <ol className="mt-3 space-y-3 text-sm text-muted">
                    {statusHistory.map((item) => (
                      <li key={`${item.status}-${item.at}`} className="relative pl-5">
                        <span className="absolute left-0 top-1 size-2 rounded-full bg-accent" />
                        <div className="text-white/80">
                          {STATUS_LABEL[item.status]}
                          {item === statusHistory.at(-1) ? " (current)" : ""}
                        </div>
                        <div className="text-xs text-muted">{item.at}</div>
                        {item.note ? (
                          <div className="text-xs text-muted">{item.note}</div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>

                {overdueMilestones.length ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                      <AlertTriangle className="h-4 w-4" />
                      Overdue milestones
                    </div>
                    <ul className="mt-2 space-y-1">
                      {overdueMilestones.map((milestone) => (
                        <li key={milestone.id} className="flex items-center justify-between">
                          <span>{milestone.title}</span>
                          <span className="text-xs">{milestone.due}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card tone="glass" className="border border-border/60">
              <div className="text-sm text-muted">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted">Metrics</span>
                  <Badge variant="secondary">
                    {project.percentComplete}% complete
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted">
                      Earned Progress
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-white/80">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      Segment 4 installation trending +4% week-over-week.
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted">
                      Upcoming Focus
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-white/80">
                      <Clock className="h-4 w-4 text-accent" />
                      Coordinate lane closures for crash cushion delivery (Oct 4).
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted">
                      Owner Notes
                    </div>
                    <div className="mt-2 text-white/80">
                      Request updated CPM showing guardrail lead time mitigation.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {snapshotCard}
        </TabsContent>

        <TabsContent value="schedule">
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <Card tone="glass" className="border border-border/60">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Milestones</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    const title = window.prompt("Milestone title");
                    const due = window.prompt("Due date (YYYY-MM-DD)");
                    if (title && due) addMilestone(title, due);
                  }}
                >
                  Add Milestone
                </Button>
              </div>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones
                    .slice()
                    .sort((a, b) => a.due.localeCompare(b.due))
                    .map((milestone) => (
                      <TableRow key={milestone.id}>
                        <TableCell className="font-medium text-white/90">{milestone.title}</TableCell>
                        <TableCell className={new Date(milestone.due) < new Date() && milestone.percent < 100 ? "text-amber-300" : undefined}>
                          {milestone.due}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-accent/80"
                                style={{ width: `${milestone.percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted">{milestone.percent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const next = Math.min(100, milestone.percent + 10);
                              updateMilestonePercent(milestone.id, next);
                            }}
                          >
                            +10%
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>

            <Card tone="glass" className="border border-border/60">
              <h3 className="text-lg font-semibold text-white">Next 7 days</h3>
              <ul className="mt-3 space-y-3 text-sm text-muted">
                {nextSevenMilestones.length ? (
                  nextSevenMilestones.map((milestone) => (
                    <li
                      key={milestone.id}
                      className="rounded-lg border border-border/40 bg-foreground/5 p-3"
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
                        <span>{milestone.due}</span>
                        <span>{milestone.percent}%</span>
                      </div>
                      <div className="text-white/80">{milestone.title}</div>
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg border border-border/40 bg-foreground/5 p-3 text-xs text-muted">
                    No milestones due within the next week.
                  </li>
                )}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="rounded-2xl border border-border/60 bg-surface-soft/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Kanban</h3>
                <p className="text-sm text-muted">
                  Quick moves keep crews aligned. Drag-and-drop is coming—use the bump buttons for now.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="New task title…"
                />
                <Button onClick={handleAddTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {lanes.map((lane) => (
                <div
                  key={lane.key}
                  className="rounded-xl border border-border/40 bg-foreground/5 p-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">{lane.title}</h4>
                    <Badge variant="secondary">
                      {tasks.filter((task) => task.lane === lane.key).length}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-muted">
                    {tasks.filter((task) => task.lane === lane.key).length ? (
                      tasks
                        .filter((task) => task.lane === lane.key)
                        .map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg border border-border/40 bg-background/40 p-3"
                          >
                            <div className="text-white/90">{task.title}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                              {task.assignee ? (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5 text-accent" />
                                  {task.assignee}
                                </span>
                              ) : null}
                              {task.due ? (
                                <span className={`inline-flex items-center gap-1 ${isDueSoon(task.due) ? "text-amber-300" : ""}`}>
                                  <CalendarDays className="h-3.5 w-3.5 text-accent" />
                                  {task.due}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {lane.key !== "BACKLOG" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateTaskLane(task.id, "BACKLOG")}
                                >
                                  ← Backlog
                                </Button>
                              ) : null}
                              {lane.key !== "READY" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateTaskLane(task.id, "READY")}
                                >
                                  Ready
                                </Button>
                              ) : null}
                              {lane.key !== "DOING" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateTaskLane(task.id, "DOING")}
                                >
                                  Doing
                                </Button>
                              ) : null}
                              {lane.key !== "BLOCKED" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateTaskLane(task.id, "BLOCKED")}
                                >
                                  Blocked
                                </Button>
                              ) : null}
                              {lane.key !== "DONE" ? (
                                <Button
                                  size="sm"
                                  onClick={() => completeTask(task.id)}
                                >
                                  Mark done
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/40 bg-background/20 p-3 text-xs text-muted">
                        Nothing here yet.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financials">
          <Card tone="glass" className="border border-border/60">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Budget Summary</h3>
              <Button
                variant="outline"
                onClick={() => {
                  onAddBudgetLine(projectId, {});
                  window.alert("Budget line creation coming soon.");
                }}
              >
                Add Line
              </Button>
            </div>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Planned</TableHead>
                  <TableHead>Committed</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium text-white/90">{line.category}</TableCell>
                    <TableCell>{formatCurrency(line.planned)}</TableCell>
                    <TableCell>{formatCurrency(line.committed)}</TableCell>
                    <TableCell>{formatCurrency(line.spent)}</TableCell>
                    <TableCell>{formatCurrency(line.planned - line.spent)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditBudgetLine(projectId, line)}
                      >
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-white/5 font-semibold text-white">
                  <TableCell>Total</TableCell>
                  <TableCell>{formatCurrency(totals.planned)}</TableCell>
                  <TableCell>{formatCurrency(totals.committed)}</TableCell>
                  <TableCell>{formatCurrency(totals.spent)}</TableCell>
                  <TableCell>{formatCurrency(totals.variance)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="changes">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card tone="glass" className="border border-border/60">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">RFIs</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    onAddRFI(projectId, {});
                    window.alert("RFI capture coming soon.");
                  }}
                >
                  Log RFI
                </Button>
              </div>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfis.map((rfi) => (
                    <TableRow key={rfi.id}>
                      <TableCell className="font-medium text-white/90">{rfi.id}</TableCell>
                      <TableCell className="text-white/80">{rfi.title}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            rfi.status === "OPEN"
                              ? "bg-amber-500/20 text-amber-200"
                              : rfi.status === "ANSWERED"
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "bg-zinc-500/20 text-zinc-200"
                          }
                        >
                          {rfi.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{rfi.due ?? "—"}</TableCell>
                      <TableCell>{rfi.owner ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card tone="glass" className="border border-border/60">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Change Orders</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    onAddCO(projectId, {});
                    window.alert("Change order workflow coming soon.");
                  }}
                >
                  Add CO
                </Button>
              </div>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changeOrders.map((co) => (
                    <TableRow key={co.id}>
                      <TableCell className="font-medium text-white/90">{co.id}</TableCell>
                      <TableCell className="text-white/80">{co.title}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            co.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : co.status === "SUBMITTED"
                                ? "bg-sky-500/20 text-sky-200"
                                : co.status === "REJECTED"
                                  ? "bg-rose-500/20 text-rose-200"
                                  : "bg-zinc-500/20 text-zinc-200"
                          }
                        >
                          {co.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{co.amount ? formatCurrency(co.amount, 0) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks">
          <Card tone="glass" className="border border-border/60">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Risk Register</h3>
              <Button
                variant="outline"
                onClick={() => {
                  const title = window.prompt("Risk title");
                  if (title) addRisk(title);
                }}
              >
                Add Risk
              </Button>
            </div>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Risk</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Mitigation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="text-white/80">{risk.title}</TableCell>
                    <TableCell>
                      <Badge className={severityClass(risk.probability, risk.impact)}>
                        {risk.probability * risk.impact}
                      </Badge>
                    </TableCell>
                    <TableCell>{risk.owner ?? "—"}</TableCell>
                    <TableCell>{risk.due ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted">{risk.mitigation ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="people">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card tone="glass" className="border border-border/60">
              <h3 className="text-lg font-semibold text-white">Contacts</h3>
              <ul className="mt-3 space-y-3 text-sm text-muted">
                {contacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="rounded-lg border border-border/40 bg-foreground/5 p-3"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
                      <span>{contact.role}</span>
                      <span>{contact.phone ?? "—"}</span>
                    </div>
                    <div className="text-white/80">{contact.name}</div>
                    {contact.email ? (
                      <div className="text-xs text-muted">{contact.email}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>

            <Card tone="glass" className="border border-border/60">
              <h3 className="text-lg font-semibold text-white">Inventory Reservations</h3>
              <ul className="mt-3 space-y-3 text-sm text-muted">
                {inventory.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-border/40 bg-foreground/5 p-3"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
                      <span>{entry.item}</span>
                      <span>{entry.quantity} ea</span>
                    </div>
                    <div className="text-xs text-muted">Needed on {entry.neededOn}</div>
                  </li>
                ))}
                {!inventory.length ? (
                  <li className="rounded-lg border border-border/40 bg-foreground/5 p-3 text-xs text-muted">
                    No reservations logged.
                  </li>
                ) : null}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card tone="glass" className="border border-border/60">
            <h3 className="text-lg font-semibold text-white">Reports & Exports</h3>
            <p className="mt-1 text-sm text-muted">
              Generate owner-ready PDFs with the latest schedule, costs, and risk posture.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  onGenerateSnapshot(projectId);
                  window.alert("Snapshot queued.");
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Project Snapshot
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onGenerateWeekly(projectId);
                  window.alert("Weekly summary drafted.");
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Weekly Summary
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onCreateEvent(projectId);
                  window.alert("Crew coordination invite drafted.");
                }}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Crew Coordination
              </Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/40 bg-foreground/5 p-4 text-sm text-muted">
                <div className="text-xs uppercase tracking-wide text-muted">Last snapshot</div>
                <div className="mt-1 text-white/80">Sept 24, 2024 · Shared with FDOT PM</div>
              </div>
              <div className="rounded-xl border border-border/40 bg-foreground/5 p-4 text-sm text-muted">
                <div className="text-xs uppercase tracking-wide text-muted">Last weekly</div>
                <div className="mt-1 text-white/80">Sept 21, 2024 · Distribution list: Crews + Ops</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
