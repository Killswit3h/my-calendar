// app/(planner)/planner/page.tsx
"use client";

import { useMemo, useState } from "react";
import { ProjectsSidebar } from "@/components/planner/ProjectsSidebar";
import { ProjectDetail } from "@/components/planner/ProjectDetail";

type Project = {
  id: string;
  name: string;
  client?: string;
  status?: "active" | "paused" | "done";
};

type DemoTask = { id: string; title: string; status: "todo" | "doing" | "done" };

const DEMO_PROJECTS: Project[] = [
  { id: "p1", name: "Halley Engineering", status: "active", client: "Halley Engineering" },
  { id: "p2", name: "Alston Construction", status: "active", client: "Alston Construction" },
  { id: "p3", name: "CH Global", status: "active", client: "CH Global" },
  { id: "p4", name: "Weekly Asphalt", status: "paused", client: "Weekly Asphalt" },
];

const DEMO_TASKS: DemoTask[] = [
  { id: "t1", title: "Add task", status: "todo" },
  { id: "t2", title: "Sky Harbour", status: "doing" },
  { id: "t3", title: "Horizon North Apartments", status: "done" },
  { id: "t4", title: "Tech Village", status: "todo" },
];

export default function PlannerPage() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_PROJECTS[0]?.id ?? "");
  const activeId = selectedId || DEMO_PROJECTS[0]?.id || "";
  const selected = useMemo(
    () => DEMO_PROJECTS.find((project) => project.id === activeId) ?? DEMO_PROJECTS[0],
    [activeId],
  );

  const demoPlan = useMemo(() => {
    if (!selected) return null;
    const toPlanTask = (task: DemoTask) => ({
      id: `${selected.id}-${task.id}`,
      title: task.title,
      progress: task.status,
      startAt: null,
      dueAt: null,
      bucketId: `bucket-${task.status}`,
      labelList: [] as { id: string; name: string; color: string }[],
      assigneeIds: [] as string[],
    });
    return {
      id: selected.id,
      name: selected.name,
      description: selected.client,
      buckets: [
        {
          id: "bucket-todo",
          name: "To do",
          tasks: DEMO_TASKS.filter((task) => task.status === "todo").map(toPlanTask),
        },
        {
          id: "bucket-doing",
          name: "In progress",
          tasks: DEMO_TASKS.filter((task) => task.status === "doing").map(toPlanTask),
        },
        {
          id: "bucket-done",
          name: "Done",
          tasks: DEMO_TASKS.filter((task) => task.status === "done").map(toPlanTask),
        },
      ],
    };
  }, [selected]);

  const sidebarProjects = DEMO_PROJECTS.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.client,
    status: project.status,
  }));

  return (
    <main className="container mx-auto">
      {/* Desktop: two-pane layout */}
      <div className="hidden md:grid grid-cols-[320px,1fr] gap-6">
        <ProjectsSidebar
          projects={sidebarProjects}
          selectedId={activeId}
          onSelect={setSelectedId}
        />
        <ProjectDetail plan={demoPlan} />
      </div>

      {/* Mobile flow */}
      <div className="md:hidden space-y-4">
        {!selectedId ? (
          <ProjectsSidebar
            projects={sidebarProjects}
            selectedId={selectedId}
            onSelect={setSelectedId}
            mobile
          />
        ) : (
          <ProjectDetail
            plan={demoPlan}
            onBack={() => setSelectedId("")}
            mobile
          />
        )}
      </div>
    </main>
  );
}
