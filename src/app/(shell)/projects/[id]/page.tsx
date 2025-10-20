import { notFound } from "next/navigation";

import ProjectDetailClient from "./ProjectDetailClient";

export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "SUBSTANTIAL" | "CLOSED";
export type Priority = "HIGH" | "MEDIUM" | "LOW";

export type Project = {
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
};

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  due: string;
  percent: number;
};

export type TaskLane = "BACKLOG" | "READY" | "DOING" | "BLOCKED" | "DONE";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  lane: TaskLane;
  assignee?: string;
  due?: string;
};

export type BudgetLine = {
  id: string;
  projectId: string;
  category: "Labor" | "Materials" | "Equipment" | "Subs" | "Overhead";
  planned: number;
  committed: number;
  spent: number;
};

export type RFI = {
  id: string;
  projectId: string;
  title: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  due?: string;
  owner?: string;
};

export type ChangeOrder = {
  id: string;
  projectId: string;
  title: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  amount?: number;
};

export type Risk = {
  id: string;
  projectId: string;
  title: string;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  owner?: string;
  due?: string;
  mitigation?: string;
};

export type Contact = {
  id: string;
  projectId: string;
  role: "Owner" | "PM" | "Superintendent" | "Inspector" | "Sub";
  name: string;
  phone?: string;
  email?: string;
};

export type InventoryHold = {
  id: string;
  projectId: string;
  item: string;
  quantity: number;
  neededOn: string;
};

export type StatusHistory = { status: ProjectStatus; at: string; note?: string };

const projectsSeed: Project[] = [
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
    budgetPlanned: 2_200_000,
    committed: 1_815_000,
    spent: 1_465_000,
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
    budgetPlanned: 860_000,
    committed: 340_000,
    spent: 95_000,
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
    budgetPlanned: 1_480_000,
    committed: 1_402_000,
    spent: 1_327_500,
  },
];

const milestonesSeed: Milestone[] = [
  { id: "ms1", projectId: "proj-guardrail-i95", title: "Maintenance of traffic setup", due: "2024-07-15", percent: 100 },
  { id: "ms2", projectId: "proj-guardrail-i95", title: "Guardrail demo Segment 3", due: "2024-09-10", percent: 85 },
  { id: "ms3", projectId: "proj-guardrail-i95", title: "Install Segment 4 guardrail panels", due: "2024-11-05", percent: 10 },
  { id: "ms4", projectId: "proj-guardrail-i95", title: "Final punch with FDOT", due: "2025-02-08", percent: 0 },
  { id: "ms5", projectId: "proj-guardrail-i95", title: "Safety audit closeout", due: "2025-02-12", percent: 0 },
  { id: "ms6", projectId: "proj-royal-palms-fence", title: "Concept approval", due: "2024-09-30", percent: 90 },
  { id: "ms7", projectId: "proj-royal-palms-fence", title: "Submit shop drawings", due: "2024-10-18", percent: 0 },
  { id: "ms8", projectId: "proj-royal-palms-fence", title: "Fabricate custom gates", due: "2024-11-22", percent: 0 },
  { id: "ms9", projectId: "proj-royal-palms-fence", title: "Install perimeter panels", due: "2024-12-18", percent: 0 },
  { id: "ms10", projectId: "proj-royal-palms-fence", title: "Commission lighting", due: "2025-01-08", percent: 0 },
  { id: "ms11", projectId: "proj-south-creek-campus", title: "Perimeter fencing complete", due: "2024-05-12", percent: 100 },
  { id: "ms12", projectId: "proj-south-creek-campus", title: "Guardrail install at bus loop", due: "2024-06-20", percent: 100 },
  { id: "ms13", projectId: "proj-south-creek-campus", title: "Access control commissioning", due: "2024-08-22", percent: 90 },
  { id: "ms14", projectId: "proj-south-creek-campus", title: "Punch-walk with Facilities", due: "2024-10-03", percent: 25 },
  { id: "ms15", projectId: "proj-south-creek-campus", title: "Closeout package delivered", due: "2024-10-15", percent: 0 },
];

const tasksSeed: Task[] = [
  { id: "t1", projectId: "proj-guardrail-i95", title: "Submit MOT revision for Segment 5", lane: "BACKLOG" },
  { id: "t2", projectId: "proj-guardrail-i95", title: "Coordinate night shift staffing", lane: "READY", due: "2024-10-05" },
  { id: "t3", projectId: "proj-guardrail-i95", title: "Install crash cushions @ MM 15", lane: "DOING", assignee: "Luis Peña", due: "2024-10-03" },
  { id: "t4", projectId: "proj-guardrail-i95", title: "Order galvanized posts", lane: "BLOCKED", assignee: "Buyer", due: "2024-09-28" },
  { id: "t5", projectId: "proj-guardrail-i95", title: "QA punch list Segment 2", lane: "DONE" },
  { id: "t6", projectId: "proj-royal-palms-fence", title: "Review architectural mockups", lane: "READY", assignee: "Andre Silva", due: "2024-10-04" },
  { id: "t7", projectId: "proj-royal-palms-fence", title: "Validate underground utility locates", lane: "BACKLOG" },
  { id: "t8", projectId: "proj-south-creek-campus", title: "Closeout documents to district", lane: "DOING", assignee: "Kimberly Rhodes", due: "2024-09-30" },
  { id: "t9", projectId: "proj-south-creek-campus", title: "Prepare punch tickets", lane: "READY", due: "2024-09-28" },
  { id: "t10", projectId: "proj-south-creek-campus", title: "Facility orientation session", lane: "BACKLOG" },
];

const budgetSeed: BudgetLine[] = [
  { id: "b1", projectId: "proj-guardrail-i95", category: "Labor", planned: 820_000, committed: 640_000, spent: 512_000 },
  { id: "b2", projectId: "proj-guardrail-i95", category: "Materials", planned: 670_000, committed: 520_000, spent: 398_000 },
  { id: "b3", projectId: "proj-guardrail-i95", category: "Equipment", planned: 280_000, committed: 205_000, spent: 176_000 },
  { id: "b4", projectId: "proj-guardrail-i95", category: "Subs", planned: 310_000, committed: 278_000, spent: 227_000 },
  { id: "b5", projectId: "proj-guardrail-i95", category: "Overhead", planned: 120_000, committed: 120_000, spent: 152_000 },
  { id: "b6", projectId: "proj-royal-palms-fence", category: "Labor", planned: 240_000, committed: 86_000, spent: 32_000 },
  { id: "b7", projectId: "proj-royal-palms-fence", category: "Materials", planned: 380_000, committed: 210_000, spent: 38_000 },
  { id: "b8", projectId: "proj-south-creek-campus", category: "Labor", planned: 540_000, committed: 530_000, spent: 512_000 },
  { id: "b9", projectId: "proj-south-creek-campus", category: "Materials", planned: 460_000, committed: 440_000, spent: 402_000 },
  { id: "b10", projectId: "proj-south-creek-campus", category: "Subs", planned: 240_000, committed: 230_000, spent: 219_000 },
];

const rfiSeed: RFI[] = [
  { id: "RFI-045", projectId: "proj-guardrail-i95", title: "Crash cushion spacing clarification", status: "OPEN", due: "2024-10-06", owner: "FDOT PM" },
  { id: "RFI-046", projectId: "proj-guardrail-i95", title: "Night closure signage detail", status: "ANSWERED", due: "2024-09-25", owner: "Design Engineer" },
  { id: "RFI-011", projectId: "proj-royal-palms-fence", title: "Panel finish sample approval", status: "OPEN", due: "2024-10-10", owner: "Architect" },
  { id: "RFI-207", projectId: "proj-south-creek-campus", title: "Access control badge integration", status: "CLOSED", due: "2024-08-12" },
];

const coSeed: ChangeOrder[] = [
  { id: "CO-09", projectId: "proj-guardrail-i95", title: "Add impact attenuator upgrades", status: "SUBMITTED", amount: 145_000 },
  { id: "CO-10", projectId: "proj-guardrail-i95", title: "Additional MOT police detail", status: "DRAFT", amount: 32_000 },
  { id: "CO-02", projectId: "proj-south-creek-campus", title: "Add ADA handrails at ramps", status: "APPROVED", amount: 18_500 },
];

const risksSeed: Risk[] = [
  { id: "RK-01", projectId: "proj-guardrail-i95", title: "Weekend rain delaying paving tie-ins", probability: 3, impact: 3, owner: "Maria Torres", due: "2024-10-12", mitigation: "Stage additional lane closures with contingency shifts." },
  { id: "RK-02", projectId: "proj-guardrail-i95", title: "Material lead time for galvanized posts", probability: 2, impact: 4, owner: "Procurement", due: "2024-09-30", mitigation: "Issue partial release with expedited freight." },
  { id: "RK-10", projectId: "proj-south-creek-campus", title: "Punch list growing before turnover", probability: 3, impact: 4, owner: "Kimberly Rhodes", due: "2024-10-05", mitigation: "Daily field walks and vendor commitments." },
];

const contactsSeed: Contact[] = [
  { id: "c1", projectId: "proj-guardrail-i95", role: "Owner", name: "Victor Alonzo", phone: "305-555-1911", email: "victor.alonzo@fdot.state.fl.us" },
  { id: "c2", projectId: "proj-guardrail-i95", role: "Superintendent", name: "Maria Torres", phone: "786-555-1200", email: "maria.torres@gfc.com" },
  { id: "c3", projectId: "proj-guardrail-i95", role: "Inspector", name: "George Wright", phone: "305-555-2221" },
  { id: "c4", projectId: "proj-royal-palms-fence", role: "Owner", name: "Claudia Reyes", phone: "954-555-7712", email: "claudia@royalpalms.com" },
  { id: "c5", projectId: "proj-south-creek-campus", role: "PM", name: "Derrick Sloan", phone: "954-555-8811", email: "derrick.sloan@browardschools.org" },
];

const inventorySeed: InventoryHold[] = [
  { id: "inv-1", projectId: "proj-guardrail-i95", item: "Guardrail panel W-beam", quantity: 320, neededOn: "2024-11-01" },
  { id: "inv-2", projectId: "proj-guardrail-i95", item: "Impact attenuator Type 350", quantity: 6, neededOn: "2024-11-12" },
  { id: "inv-3", projectId: "proj-royal-palms-fence", item: "Ornamental panel 8ft bronze", quantity: 180, neededOn: "2024-12-10" },
  { id: "inv-4", projectId: "proj-south-creek-campus", item: "Access control pedestal", quantity: 12, neededOn: "2024-09-25" },
];

const statusHistorySeed: Record<string, StatusHistory[]> = {
  "proj-guardrail-i95": [
    { status: "PLANNING", at: "2024-04-05", note: "FDOT issued NTP" },
    { status: "ACTIVE", at: "2024-07-08", note: "Field mobilization" },
    { status: "ON_HOLD", at: "2024-08-20", note: "Lane closure moratorium (48 hrs)" },
    { status: "ACTIVE", at: "2024-08-22", note: "MOT restored" },
  ],
  "proj-royal-palms-fence": [
    { status: "PLANNING", at: "2024-07-01", note: "Concept design" },
    { status: "ON_HOLD", at: "2024-08-12", note: "Awaiting HOA approval" },
    { status: "PLANNING", at: "2024-09-05", note: "Approvals received" },
  ],
  "proj-south-creek-campus": [
    { status: "PLANNING", at: "2023-12-19", note: "Board authorization" },
    { status: "ACTIVE", at: "2024-02-05", note: "Mobilization" },
    { status: "SUBSTANTIAL", at: "2024-09-15", note: "Substantial completion walk" },
  ],
};

export type ProjectDetailData = {
  project: Project;
  milestones: Milestone[];
  tasks: Task[];
  budget: BudgetLine[];
  rfis: RFI[];
  changeOrders: ChangeOrder[];
  risks: Risk[];
  statusHistory: StatusHistory[];
  contacts: Contact[];
  inventory: InventoryHold[];
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projectsSeed.find((entry) => entry.id === id);
  if (!project) notFound();

  const data: ProjectDetailData = {
    project,
    milestones: milestonesSeed.filter((milestone) => milestone.projectId === id),
    tasks: tasksSeed.filter((task) => task.projectId === id),
    budget: budgetSeed.filter((line) => line.projectId === id),
    rfis: rfiSeed.filter((entry) => entry.projectId === id),
    changeOrders: coSeed.filter((entry) => entry.projectId === id),
    risks: risksSeed.filter((entry) => entry.projectId === id),
    statusHistory: statusHistorySeed[id] ?? [],
    contacts: contactsSeed.filter((contact) => contact.projectId === id),
    inventory: inventorySeed.filter((entry) => entry.projectId === id),
  };

  return <ProjectDetailClient data={data} />;
}
