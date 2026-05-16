"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeDollarSign,
  Building2,
  Check,
  ChevronDown,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  Filter,
  Lock,
  Pencil,
  Users,
} from "lucide-react";
import { cn } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/badge";
import Card from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  crewByTeam,
  roleByTeam,
  payById,
  toLegacyId,
} from "@/data/employeeRoster";
import {
  getEmployees as getDirectoryEmployees,
  saveEmployees as saveDirectoryEmployees,
  type Employee as BaseEmployee,
  type Team as BaseTeam,
} from "@/employees";

type PayType = "HOURLY" | "SALARY";
type EmpStatus = "ACTIVE" | "ON_LEAVE" | "TERMINATED";
type Role = "Foreman" | "Skilled Labor" | "Labor" | "Yard" | "Driver" | "Welder";

type Pay = {
  type: PayType;
  base: number;
  otMultiplier?: number;
  effective: string;
};

type Cert = { code: string; label: string; expires?: string };

type Employee = {
  id: string;
  name: string;
  role: Role;
  status: EmpStatus;
  crew?: string;
  phone?: string;
  email?: string;
  address?: string;
  ssn4?: string;
  hireDate?: string;
  cdl?: boolean;
  certs?: Cert[];
  pay: Pay;
  rateHistory: Pay[];
  notes?: string;
};

type Filters = {
  status: EmpStatus | "ALL";
  role: Role | "ALL";
  crew: string | "ALL";
};

type SortKey = "name" | "role" | "status" | "pay";

type RosterPlacement = "FREE" | "YARD_SHOP" | "NO_WORK";

const dayKey = new Date().toISOString().slice(0, 10);

const assignableCrews = [
  "Guardrail A",
  "Guardrail B",
  "Fence South",
  "Fence North",
  "Logistics",
  "Yard Team",
  "Fabrication",
  "Schools",
];

const statusLabels: Record<EmpStatus, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  TERMINATED: "Terminated",
};

const statusBadgeStyles: Record<EmpStatus, string> = {
  ACTIVE:
    "border-transparent bg-emerald-500/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)]",
  ON_LEAVE:
    "border-transparent bg-amber-500/15 text-amber-200 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.35)]",
  TERMINATED:
    "border-transparent bg-zinc-700/40 text-zinc-200 shadow-[inset_0_0_0_1px_rgba(113,113,122,0.35)]",
};

const roleBadgeStyle =
  "border-transparent bg-white/6 text-white/75 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]";

const rosterPlacementLabels: Record<RosterPlacement, string> = {
  FREE: "Free",
  YARD_SHOP: "Yard/Shop",
  NO_WORK: "No Work",
};

const statusSortOrder: Record<EmpStatus, number> = {
  ACTIVE: 0,
  ON_LEAVE: 1,
  TERMINATED: 2,
};

const payFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

function formatPay(pay: Pay): string {
  if (pay.type === "SALARY") {
    return `${payFormatter.format(pay.base)}/wk salary`;
  }
  const ot = pay.otMultiplier ?? 1.5;
  return `${payFormatter.format(pay.base)}/hr (OT ${ot}x)`;
}

/** Table-friendly pay display: shows rate only, no OT suffix. */
function formatPayTable(pay: Pay): string {
  if (pay.type === "SALARY") {
    return `${payFormatter.format(pay.base)}/wk`;
  }
  return `${payFormatter.format(pay.base)}/hr`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function addDays(value: string, days: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}


function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

const EMPLOYEE_STORAGE_KEY = "app.shell.employees.v1";

function splitNameParts(rawName: string): { firstName: string; lastName: string } {
  const trimmed = rawName.trim();
  if (!trimmed) return { firstName: "New", lastName: "Employee" };
  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() ?? "New";
  const lastName = parts.length ? parts.join(" ") : "Employee";
  return { firstName, lastName };
}

function inferTeamFromCrew(crew?: string): BaseTeam {
  if (!crew) return "South";
  const normalized = crew.toLowerCase();
  if (normalized.includes("guardrail") || normalized.includes("north") || normalized.includes("central")) {
    return "Central";
  }
  return "South";
}

function resolveCrewForTeam(team: BaseTeam, crew?: string): string | undefined {
  if (crew && crew.trim().length > 0) return crew.trim();
  return crewByTeam[team];
}

function resolveRoleForTeam(team: BaseTeam, role?: Role): Role {
  if (role) return role;
  return roleByTeam[team] ?? "Labor";
}

function normalizePay(input: unknown, fallbackBase: number): Pay {
  if (input && typeof input === "object") {
    const candidate = input as Partial<Pay>;
    const base =
      typeof candidate.base === "number" && Number.isFinite(candidate.base)
        ? candidate.base
        : fallbackBase;
    const effective =
      typeof candidate.effective === "string" && candidate.effective.length > 0
        ? candidate.effective
        : new Date().toISOString().slice(0, 10);
    if (candidate.type === "SALARY") {
      return { type: "SALARY", base, effective };
    }
    const ot =
      typeof candidate.otMultiplier === "number" &&
      Number.isFinite(candidate.otMultiplier) &&
      candidate.otMultiplier > 0
        ? candidate.otMultiplier
        : 1.5;
    return { type: "HOURLY", base, otMultiplier: ot, effective };
  }
  return {
    type: "HOURLY",
    base: fallbackBase,
    otMultiplier: 1.5,
    effective: new Date().toISOString().slice(0, 10),
  };
}

function ensureEmployeeDefaults(
  employee: Partial<Employee> & { id?: string },
  directory?: BaseEmployee,
  index = 0,
): Employee {
  const directoryId = directory?.id ?? employee.id;
  const team = directory?.team ?? inferTeamFromCrew(employee.crew);
  const { firstName, lastName } = splitNameParts(
    employee.name ?? (directory ? `${directory.firstName} ${directory.lastName}` : "New Employee"),
  );
  const fallbackId = directoryId ?? toLegacyId(firstName, lastName) ?? generateId();
  const baseRate =
    typeof employee.pay?.base === "number" && Number.isFinite(employee.pay.base)
      ? employee.pay.base
      : payById[directoryId ?? ""] ?? 20 + (index % 6);
  const pay = normalizePay(employee.pay, baseRate);

  return {
    id: fallbackId,
    name: `${firstName} ${lastName}`.trim(),
    role: resolveRoleForTeam(team, employee.role),
    status: employee.status ?? "ACTIVE",
    crew: resolveCrewForTeam(team, employee.crew),
    phone: employee.phone ?? undefined,
    email: employee.email ?? undefined,
    address: employee.address ?? undefined,
    ssn4: employee.ssn4 ?? undefined,
    hireDate: employee.hireDate ?? pay.effective,
    cdl: employee.cdl ?? false,
    certs: employee.certs ?? [],
    pay,
    rateHistory:
      Array.isArray(employee.rateHistory) && employee.rateHistory.length > 0
        ? employee.rateHistory.map((entry) => normalizePay(entry, pay.base))
        : [pay],
    notes: employee.notes ?? "",
  };
}

function buildEmployeeFromDirectory(entry: BaseEmployee, index: number): Employee {
  return ensureEmployeeDefaults(
    {
      id: entry.id,
      name: `${entry.firstName} ${entry.lastName}`.trim(),
      crew: crewByTeam[entry.team],
      role: roleByTeam[entry.team],
    },
    entry,
    index,
  );
}

function readStoredEmployees(): Employee[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(EMPLOYEE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((entry, index) => ensureEmployeeDefaults(entry as Employee, undefined, index))
      .filter(Boolean);
  } catch {
    return null;
  }
}

function mergeEmployees(stored: Employee[] | null, directory: BaseEmployee[]): Employee[] {
  if (!stored) {
    return directory.map((entry, idx) => buildEmployeeFromDirectory(entry, idx));
  }
  const storedById = new Map<string, Employee>();
  stored.forEach((emp) => storedById.set(emp.id, ensureEmployeeDefaults(emp)));

  const merged = directory.map((entry, idx) => {
    const existing = storedById.get(entry.id);
    if (existing) {
      storedById.delete(entry.id);
      return ensureEmployeeDefaults(existing, entry, idx);
    }
    return buildEmployeeFromDirectory(entry, idx);
  });

  for (const leftover of storedById.values()) {
    merged.push(ensureEmployeeDefaults(leftover));
  }

  return merged;
}

function loadEmployeeState(): Employee[] {
  const directory = getDirectoryEmployees();
  const stored = readStoredEmployees();
  return mergeEmployees(stored, directory);
}

function syncDirectoryEmployees(list: Employee[]) {
  const simplified: BaseEmployee[] = list.map((emp) => {
    const { firstName, lastName } = splitNameParts(emp.name);
    return {
      id: emp.id,
      firstName,
      lastName,
      team: inferTeamFromCrew(emp.crew),
    };
  });
  saveDirectoryEmployees(simplified);
}

function deriveEmployeeIdentity(
  rawName: string,
  crew: string | undefined,
  existingIds: Set<string>,
): { id: string; firstName: string; lastName: string; team: BaseTeam } {
  const { firstName, lastName } = splitNameParts(rawName);
  const baseSlug = toLegacyId(firstName, lastName);
  const baseId = baseSlug.length ? baseSlug : generateId();
  let candidate = baseId;
  let suffix = 2;
  while (existingIds.has(candidate)) {
    candidate = `${baseId}-${suffix++}`;
  }
  return { id: candidate, firstName, lastName, team: inferTeamFromCrew(crew) };
}

function AvatarBubble({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const parts = name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

  const classes =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : "h-12 w-12 text-sm";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-emerald-500/25 via-emerald-400/10 to-emerald-500/30 text-white/90 font-semibold",
        classes,
      )}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: EmpStatus }) {
  return (
    <Badge className={statusBadgeStyles[status]}>
      {statusLabels[status]}
    </Badge>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="secondary" className={roleBadgeStyle}>
      {role}
    </Badge>
  );
}

interface EmployeesCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label"?: string;
}

function EmployeesCheckbox({
  checked,
  onCheckedChange,
  ...props
}: EmployeesCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded border border-border bg-card transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        checked ? "border-accent bg-accent text-background" : "text-transparent",
      )}
      {...props}
    >
      <span className="sr-only">{checked ? "Deselect" : "Select"}</span>
      {checked ? <Check className="h-3.5 w-3.5" /> : null}
    </button>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.22em] transition",
        active ? "text-accent" : "text-muted hover:text-foreground",
      )}
    >
      {label}
      <ChevronDown
        className={cn(
          "h-3 w-3 transition",
          active && direction === "asc" ? "-rotate-180" : "",
          active ? "opacity-100" : "opacity-50",
        )}
      />
    </button>
  );
}

function RosterMenu({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (placement: RosterPlacement) => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-40 rounded-xl border border-border/60 bg-surface-soft p-2 shadow-lg">
      {(
        [
          ["FREE", "Free"] as const,
          ["YARD_SHOP", "Yard / Shop"] as const,
          ["NO_WORK", "No Work"] as const,
        ] satisfies Array<[RosterPlacement, string]>
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-foreground/10 hover:text-foreground"
          onClick={() => {
            onSelect(value);
            onClose();
          }}
        >
          <span>{label}</span>
          <ChevronDown className="h-3 w-3 rotate-[-90deg] text-muted" />
        </button>
      ))}
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    status: "ALL",
    role: "ALL",
    crew: "ALL",
  });
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>(
    { key: "name", direction: "asc" },
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [payDialog, setPayDialog] = useState<{ open: boolean; employeeId?: string }>({ open: false });
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; employeeId?: string }>({ open: false });
  const [bulkAssignDialog, setBulkAssignDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    employeeId?: string;
    bulk?: boolean;
  }>({ open: false });
  const [newDialog, setNewDialog] = useState(false);
  const [payDraft, setPayDraft] = useState<Pay | null>(null);
  const [assignCrewDraft, setAssignCrewDraft] = useState("");
  const [bulkAssignCrewDraft, setBulkAssignCrewDraft] = useState("");
  const [bulkPlacementMenu, setBulkPlacementMenu] = useState(false);
  const [rosterMenuFor, setRosterMenuFor] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Partial<Employee>>({});
  const [ssnRevealed, setSsnRevealed] = useState(false);
  const [terminateDialog, setTerminateDialog] = useState<{ open: boolean; employeeId?: string }>({ open: false });
  const [terminateDraft, setTerminateDraft] = useState({ reason: "", notes: "", effectiveDate: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    const initial = loadEmployeeState();
    setEmployees(initial);
    syncDirectoryEmployees(initial);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(employees));
      }
    } catch {
      // Ignore storage write failures (private browsing, quotas, etc.)
    }
    syncDirectoryEmployees(employees);
  }, [employees, hydrated]);

  const crews = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => {
      if (emp.crew) set.add(emp.crew);
    });
    assignableCrews.forEach((crew) => set.add(crew));
    return Array.from(set);
  }, [employees]);

  const onSearch = useCallback((value: string) => {
    console.log("employees:search", value);
    setQuery(value);
  }, []);

  const onFilterChange = useCallback((partial: Partial<Filters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      console.log("employees:filter", next);
      return next;
    });
  }, []);

  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter((emp) => {
      const lowerQ = query.trim().toLowerCase();
      const matchesQuery =
        !lowerQ ||
        emp.name.toLowerCase().includes(lowerQ) ||
        (emp.crew ?? "").toLowerCase().includes(lowerQ) ||
        emp.role.toLowerCase().includes(lowerQ) ||
        (emp.email ?? "").toLowerCase().includes(lowerQ);
      const matchesStatus = filters.status === "ALL" || emp.status === filters.status;
      const matchesRole = filters.role === "ALL" || emp.role === filters.role;
      const matchesCrew = filters.crew === "ALL" || (emp.crew ?? "") === filters.crew;
      return matchesQuery && matchesStatus && matchesRole && matchesCrew;
    });

    const sorted = [...filtered].sort((a, b) => {
      const direction = sort.direction === "asc" ? 1 : -1;
      switch (sort.key) {
        case "name":
          return direction * a.name.localeCompare(b.name);
        case "role":
          return direction * a.role.localeCompare(b.role);
        case "status":
          return direction * (statusSortOrder[a.status] - statusSortOrder[b.status]);
        case "pay": {
          const aValue = a.pay.base;
          const bValue = b.pay.base;
          return direction * (aValue - bValue);
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [employees, query, filters, sort]);

  const selectedEmployees = useMemo(
    () => employees.filter((emp) => selectedIds.includes(emp.id)),
    [employees, selectedIds],
  );

  const currentEmployee = useMemo(
    () => (drawerId ? employees.find((emp) => emp.id === drawerId) ?? null : null),
    [drawerId, employees],
  );


  useEffect(() => {
    if (payDialog.open && payDialog.employeeId) {
      const target = employees.find((emp) => emp.id === payDialog.employeeId);
      if (target) {
        setPayDraft({ ...target.pay });
      }
    } else {
      setPayDraft(null);
    }
  }, [payDialog, employees]);

  useEffect(() => {
    if (assignDialog.open && assignDialog.employeeId) {
      const target = employees.find((emp) => emp.id === assignDialog.employeeId);
      setAssignCrewDraft(target?.crew ?? "");
    } else if (!assignDialog.open) {
      setAssignCrewDraft("");
    }
  }, [assignDialog, employees]);

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((value) => value !== id);
    });
  }, []);

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? filteredEmployees.map((emp) => emp.id) : []);
    },
    [filteredEmployees],
  );

  const onCreateEmployee = useCallback(
    (payload: Partial<Employee>) => {
      const existingIds = new Set(employees.map((emp) => emp.id));
      const name = payload.name ?? "New Employee";
      const crewValue = payload.crew?.trim() || undefined;
      const identity = deriveEmployeeIdentity(name, crewValue, existingIds);
      const basePay = typeof payload.pay?.base === "number" ? payload.pay.base : 18;
      const pay: Pay = payload.pay ? normalizePay(payload.pay, basePay) : normalizePay(undefined, basePay);

      const draft: Partial<Employee> = {
        id: identity.id,
        name: `${identity.firstName} ${identity.lastName}`.trim(),
        role: payload.role ?? "Labor",
        status: payload.status ?? "ACTIVE",
        crew: crewValue,
        phone: payload.phone ?? undefined,
        email: payload.email ?? undefined,
        address: payload.address ?? undefined,
        ssn4: payload.ssn4 ?? undefined,
        hireDate: payload.hireDate ?? pay.effective,
        cdl: payload.cdl ?? false,
        certs: payload.certs ?? [],
        pay,
        rateHistory: payload.rateHistory ?? [pay],
        notes: payload.notes ?? "",
      };

      const employee = ensureEmployeeDefaults(draft);
      setEmployees((prev) => [employee, ...prev]);
      setDrawerId(employee.id);
      setSheetOpen(true);
      console.log("employees:create", employee);
    },
    [employees],
  );

  const setEmployee = useCallback(
    (id: string, updater: (employee: Employee) => Employee) => {
      setEmployees((prev) => prev.map((emp) => (emp.id === id ? updater(emp) : emp)));
    },
    [],
  );

  const onEditPay = useCallback(
    (empId: string, next: Pay) => {
      console.log("employees:edit-pay", empId, next);
      setEmployee(empId, (emp) => ({
        ...emp,
        pay: next,
        rateHistory: [{ ...next }, ...emp.rateHistory],
      }));
    },
    [setEmployee],
  );

  const onAssignCrew = useCallback(
    (empId: string, crew: string) => {
      console.log("employees:assign-crew", empId, crew);
      setEmployee(empId, (emp) => ({ ...emp, crew }));
    },
    [setEmployee],
  );

  const onSetStatus = useCallback(
    (empId: string, status: EmpStatus) => {
      console.log("employees:set-status", empId, status);
      setEmployee(empId, (emp) => ({ ...emp, status }));
    },
    [setEmployee],
  );

  const onBulkAssignCrew = useCallback(
    (crew: string) => {
      console.log("employees:bulk-assign-crew", { selectedIds, crew });
      setEmployees((prev) =>
        prev.map((emp) => (selectedIds.includes(emp.id) ? { ...emp, crew } : emp)),
      );
    },
    [selectedIds],
  );

  const onBulkSetStatus = useCallback(
    (status: EmpStatus) => {
      console.log("employees:bulk-set-status", { selectedIds, status });
      setEmployees((prev) =>
        prev.map((emp) => (selectedIds.includes(emp.id) ? { ...emp, status } : emp)),
      );
    },
    [selectedIds],
  );

  const onExportCSV = useCallback(
    (selectedOnly = false) => {
      const rows = selectedOnly ? selectedEmployees : filteredEmployees;
      const header = [
        "ID",
        "Name",
        "Role",
        "Status",
        "Crew",
        "Pay",
        "Effective",
        "Phone",
        "Email",
      ];
      const csv = [
        header,
        ...rows.map((emp) => [
          emp.id,
          emp.name,
          emp.role,
          emp.status,
          emp.crew ?? "",
          formatPay(emp.pay),
          formatDate(emp.pay.effective),
          emp.phone ?? "",
          emp.email ?? "",
        ]),
      ]
        .map((columns) =>
          columns.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = selectedOnly ? "employees-selected.csv" : "employees.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      console.log("employees:export-csv", { selectedOnly, rows: rows.length });
      return csv;
    },
    [filteredEmployees, selectedEmployees],
  );

  const onMoveToday = useCallback(
    async (empId: string, placement: RosterPlacement) => {
      console.log("employees:move-today", { empId, placement, dayKey });
      try {
        await fetch("/api/roster/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: empId, dayKey, placement }),
        });
      } catch (error) {
        console.error("Failed to move employee", error);
      }
    },
    [],
  );

  const onBulkMoveToday = useCallback(
    (placement: RosterPlacement) => {
      selectedIds.forEach((id) => {
        void onMoveToday(id, placement);
      });
    },
    [selectedIds, onMoveToday],
  );

  const openDrawer = useCallback(
    (id: string) => {
      setDrawerId(id);
      setSheetOpen(true);
      setEditMode(false);
      setSsnRevealed(false);
      setProfileDraft({});
    },
    [],
  );

  const onSaveProfile = useCallback(
    (empId: string, draft: Partial<Employee>) => {
      setEmployee(empId, (emp) => ({
        ...emp,
        name: draft.name ?? emp.name,
        role: draft.role ?? emp.role,
        status: draft.status ?? emp.status,
        crew: draft.crew !== undefined ? (draft.crew || undefined) : emp.crew,
        phone: draft.phone !== undefined ? (draft.phone || undefined) : emp.phone,
        email: draft.email !== undefined ? (draft.email || undefined) : emp.email,
        address: draft.address !== undefined ? (draft.address || undefined) : emp.address,
        ssn4: draft.ssn4 !== undefined ? (draft.ssn4 || undefined) : emp.ssn4,
        cdl: draft.cdl !== undefined ? draft.cdl : emp.cdl,
        notes: draft.notes !== undefined ? draft.notes : emp.notes,
      }));
      setEditMode(false);
      setProfileDraft({});
    },
    [setEmployee],
  );

  const isAllSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedIds.includes(emp.id));



  const payDialogEmployee = payDialog.employeeId
    ? employees.find((emp) => emp.id === payDialog.employeeId) ?? null
    : null;

  const assignDialogEmployee = assignDialog.employeeId
    ? employees.find((emp) => emp.id === assignDialog.employeeId) ?? null
    : null;

  const statusDialogLabel = statusDialog.bulk
    ? "Set Status for Selected"
    : statusDialog.employeeId
      ? `Set Status • ${employees.find((emp) => emp.id === statusDialog.employeeId)?.name ?? ""}`
      : "Set Status";

  const sortBy = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: key === "pay" ? "desc" : "asc" };
    });
  };

  const selectedCount = selectedIds.length;

  const rosterOptions: Array<[RosterPlacement, string]> = [
    ["FREE", "Free"],
    ["YARD_SHOP", "Yard / Shop"],
    ["NO_WORK", "No Work"],
  ];

  const resetSelections = () => setSelectedIds([]);

  const handleNewEmployeeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payType = formData.get("payType") as PayType;
    const base = Number(formData.get("payBase"));
    const ot = Number(formData.get("payOt") || 1.5);
    const nextPay: Pay =
      payType === "SALARY"
        ? {
            type: "SALARY",
            base,
            effective: String(formData.get("payEffective") || new Date().toISOString().slice(0, 10)),
          }
        : {
            type: "HOURLY",
            base,
            otMultiplier: ot,
            effective: String(formData.get("payEffective") || new Date().toISOString().slice(0, 10)),
          };

    onCreateEmployee({
      name: String(formData.get("name") || "New Employee"),
      role: (formData.get("role") as Role) ?? "Labor",
      status: (formData.get("status") as EmpStatus) ?? "ACTIVE",
      crew: String(formData.get("crew") || "") || undefined,
      phone: String(formData.get("phone") || "") || undefined,
      email: String(formData.get("email") || "") || undefined,
      hireDate: String(formData.get("hireDate") || "") || undefined,
      cdl: formData.get("cdl") === "on",
      notes: String(formData.get("notes") || ""),
      pay: nextPay,
      rateHistory: [nextPay],
    });
    setNewDialog(false);
    event.currentTarget.reset();
  };

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-8 lg:px-10">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[rgba(23,23,23,0.3)] p-4 text-white shadow-[0_20px_60px_rgba(3,6,23,0.45)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            <Users className="h-4 w-4 text-emerald-300" />
            Employees
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                onExportCSV(false);
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button className="gap-2" onClick={() => setNewDialog(true)}>
              <BadgeDollarSign className="h-4 w-4" />
              New Employee
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-2">
            <Filter className="h-4 w-4 text-white/60" />
            <Input
              value={query}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search name, crew, or contact"
              className="border-none bg-transparent px-0 text-white placeholder:text-white/50 focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select
              label="Status"
              value={filters.status}
              onChange={(event) =>
                onFilterChange({ status: event.target.value as EmpStatus | "ALL" })
              }
              className="min-w-[160px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>
            </Select>
            <Select
              label="Role"
              value={filters.role}
              onChange={(event) =>
                onFilterChange({ role: event.target.value as Role | "ALL" })
              }
              className="min-w-[160px]"
            >
              <option value="ALL">All Roles</option>
              <option value="Foreman">Foreman</option>
              <option value="Skilled Labor">Skilled Labor</option>
              <option value="Labor">Labor</option>
              <option value="Yard">Yard</option>
              <option value="Driver">Driver</option>
              <option value="Welder">Welder</option>
            </Select>
            <Select
              label="Crew"
              value={filters.crew}
              onChange={(event) =>
                onFilterChange({ crew: event.target.value as string | "ALL" })
              }
              className="min-w-[160px]"
            >
              <option value="ALL">All Crews</option>
              {crews.map((crew) => (
                <option key={crew} value={crew}>
                  {crew}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-300" />
            <span>
              {filteredEmployees.length} team member
              {filteredEmployees.length === 1 ? "" : "s"} ready for Guardrail & Fence ops
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/50">
            <Building2 className="h-4 w-4" />
            Today {dayKey}
          </div>
        </div>
      </div>

    <Card
      tone="surface"
      bordered
      className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(23,23,23,1)] text-white shadow-[0_20px_60px_rgba(3,6,23,0.45)] backdrop-blur-xl"
    >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>
                    <SortButton
                      label="Name"
                      active={sort.key === "name"}
                      direction={sort.direction}
                      onClick={() => sortBy("name")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      label="Role"
                      active={sort.key === "role"}
                      direction={sort.direction}
                      onClick={() => sortBy("role")}
                    />
                  </TableHead>
                  <TableHead>Office Location</TableHead>
                  <TableHead>
                    <SortButton
                      label="Status"
                      active={sort.key === "status"}
                      direction={sort.direction}
                      onClick={() => sortBy("status")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      label="Pay"
                      active={sort.key === "pay"}
                      direction={sort.direction}
                      onClick={() => sortBy("pay")}
                    />
                  </TableHead>
                  <TableHead>Effective</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer border-white/10 hover:bg-white/5"
                    onClick={() => openDrawer(emp.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AvatarBubble name={emp.name} size="sm" />
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {emp.name}
                          </div>
                          <div className="text-xs text-muted">
                            {emp.hireDate ? `Hired ${formatDate(emp.hireDate)}` : "Hire date TBD"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={emp.role} />
                    </TableCell>
                    <TableCell className="text-sm text-muted">
                      {emp.crew ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={emp.status} />
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {formatPayTable(emp.pay)}
                    </TableCell>
                    <TableCell className="text-sm text-muted">
                      {formatDate(emp.pay.effective)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
      </Card>

      <AnimatePresence>
        {selectedCount > 0 ? (
          <motion.div
            key="bulk-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="fixed bottom-6 left-1/2 z-40 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 rounded-2xl border border-border/80 bg-surface-soft/95 px-6 py-4 shadow-xl backdrop-blur"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <BadgeDollarSign className="h-4 w-4 text-accent" />
                <span className="font-semibold text-foreground">
                  {selectedCount} selected
                </span>
                <span className="hidden md:inline">|</span>
                <span>
                  Bulk update roster, crew, or status. CSV export limited to selection.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAssignDialog(true)}
                >
                  Assign Crew
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusDialog({ open: true, bulk: true })}
                >
                  Set Status
                </Button>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setBulkPlacementMenu((prev) => !prev)}
                  >
                    Move Today
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                  {bulkPlacementMenu ? (
                    <div className="absolute right-0 top-full z-40 mt-2 w-40 rounded-xl border border-border/60 bg-surface-soft p-2 shadow-lg">
                      {rosterOptions.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-foreground/10 hover:text-foreground"
                          onClick={() => {
                            onBulkMoveToday(value);
                            setBulkPlacementMenu(false);
                          }}
                        >
                          <span>{label}</span>
                          <ChevronDown className="h-3 w-3 rotate-[-90deg] text-muted" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExportCSV(true)}
                >
                  Export CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted"
                  onClick={resetSelections}
                >
                  Clear
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Employee Profile Modal ─────────────────────────────────────── */}
      <Dialog
        open={sheetOpen && Boolean(currentEmployee)}
        onOpenChange={(open) => {
          if (!open) {
            setSheetOpen(false);
            setDrawerId(null);
            setEditMode(false);
            setSsnRevealed(false);
            setProfileDraft({});
          }
        }}
      >
        <DialogContent className="max-w-2xl gap-0 p-0 bg-[rgba(23,23,23,0.6)] backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(3,6,23,0.55)] text-white overflow-hidden [&>button.absolute]:z-20 [&>button.absolute]:text-white/40 [&>button.absolute]:hover:text-white [&>button.absolute]:top-5 [&>button.absolute]:right-5">
          <DialogTitle className="sr-only">
            {currentEmployee ? `Employee Profile: ${currentEmployee.name}` : "Employee Profile"}
          </DialogTitle>

          {currentEmployee ? (
            <div className="relative flex flex-col max-h-[88vh]">
              {/* Ambient glows */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl z-0" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl z-0" />

              {/* ── Header ───────────────────────────────────────────────── */}
              <div className="relative z-10 px-6 pt-6 pb-5 pr-14 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-base font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                      {(profileDraft.name ?? currentEmployee.name)
                        .split(" ")
                        .map((p: string) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                        Employee Profile
                      </p>
                      {editMode ? (
                        <Input
                          value={profileDraft.name ?? ""}
                          onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="mt-1 h-9 bg-white/5 border-white/20 text-white text-xl font-bold"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold text-white truncate">
                          {currentEmployee.name}
                        </h2>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2 mt-1">
                    {editMode ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                          onClick={() => onSaveProfile(currentEmployee.id, profileDraft)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                          onClick={() => { setEditMode(false); setProfileDraft({}); }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                        onClick={() => { setProfileDraft({ ...currentEmployee }); setEditMode(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Badges / role+status selects */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {editMode ? (
                    <>
                      <Select
                        label="Role"
                        value={profileDraft.role ?? currentEmployee.role}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({ ...prev, role: e.target.value as Role }))
                        }
                        className="min-w-[140px]"
                      >
                        <option value="Foreman">Foreman</option>
                        <option value="Skilled Labor">Skilled Labor</option>
                        <option value="Labor">Labor</option>
                        <option value="Yard">Yard</option>
                        <option value="Driver">Driver</option>
                        <option value="Welder">Welder</option>
                      </Select>
                      <Select
                        label="Status"
                        value={profileDraft.status ?? currentEmployee.status}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({
                            ...prev,
                            status: e.target.value as EmpStatus,
                          }))
                        }
                        className="min-w-[130px]"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="ON_LEAVE">On Leave</option>
                        <option value="TERMINATED">Terminated</option>
                      </Select>
                    </>
                  ) : (
                    <>
                      <RoleBadge role={currentEmployee.role} />
                      <StatusBadge status={currentEmployee.status} />
                      {currentEmployee.crew ? (
                        <Badge className="border-transparent bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
                          {currentEmployee.crew}
                        </Badge>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {/* ── Scrollable body ───────────────────────────────────────── */}
              <div className="relative z-10 flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* EMPLOYMENT */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                    Employment
                  </h3>
                  <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40">Office Location</div>
                      {editMode ? (
                        <Select
                          label=""
                          value={profileDraft.crew ?? currentEmployee.crew ?? ""}
                          onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, crew: e.target.value }))
                          }
                        >
                          <option value="">Unassigned</option>
                          {crews.map((crew) => (
                            <option key={crew} value={crew}>{crew}</option>
                          ))}
                        </Select>
                      ) : (
                        <div className="text-sm text-white">{currentEmployee.crew ?? "—"}</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40">Hire Date</div>
                      <div className="text-sm text-white">{formatDate(currentEmployee.hireDate)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40">Phone</div>
                      {editMode ? (
                        <Input
                          value={profileDraft.phone ?? ""}
                          onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, phone: e.target.value || undefined }))
                          }
                          placeholder="305-555-0101"
                          className="h-8 bg-white/5 border-white/20 text-white text-sm"
                        />
                      ) : (
                        <div className="text-sm text-white">{currentEmployee.phone ?? "—"}</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40">Email</div>
                      {editMode ? (
                        <Input
                          type="email"
                          value={profileDraft.email ?? ""}
                          onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, email: e.target.value || undefined }))
                          }
                          placeholder="name@company.com"
                          className="h-8 bg-white/5 border-white/20 text-white text-sm"
                        />
                      ) : (
                        <div className="text-sm text-white">{currentEmployee.email ?? "—"}</div>
                      )}
                    </div>
                    <div className="space-y-1 col-span-2">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40">Address</div>
                      {editMode ? (
                        <Input
                          value={profileDraft.address ?? ""}
                          onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, address: e.target.value || undefined }))
                          }
                          placeholder="123 Main St, Miami, FL 33101"
                          className="h-8 bg-white/5 border-white/20 text-white text-sm"
                        />
                      ) : (
                        <div className="text-sm text-white">{currentEmployee.address ?? "—"}</div>
                      )}
                    </div>
                  </div>
                </section>

                {/* SENSITIVE */}
                <section className="space-y-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                    <Lock className="h-3 w-3 text-white/25" />
                    Sensitive
                  </h3>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-[0.2em] text-white/40">SSN (Last 4)</div>
                        {editMode ? (
                          <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={profileDraft.ssn4 ?? ""}
                            onChange={(e) =>
                              setProfileDraft((prev) => ({
                                ...prev,
                                ssn4: e.target.value.replace(/\D/g, "").slice(0, 4) || undefined,
                              }))
                            }
                            placeholder="1234"
                            className="h-8 w-24 bg-white/5 border-white/20 text-white text-sm font-mono"
                          />
                        ) : (
                          <div className="mt-1 font-mono text-base text-white">
                            {ssnRevealed ? (
                              currentEmployee.ssn4 ?? (
                                <span className="text-sm text-white/30">Not set</span>
                              )
                            ) : (
                              <span className="tracking-widest text-white/60">••••</span>
                            )}
                          </div>
                        )}
                      </div>
                      {!editMode && (
                        <button
                          type="button"
                          onClick={() => setSsnRevealed((prev) => !prev)}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
                        >
                          {ssnRevealed ? (
                            <><EyeOff className="h-3.5 w-3.5" /> Hide</>
                          ) : (
                            <><Eye className="h-3.5 w-3.5" /> Reveal</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                {/* PAY */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Pay</h3>
                  <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-lg font-semibold text-white">
                        <DollarSign className="h-5 w-5 text-emerald-400" />
                        {formatPay(currentEmployee.pay)}
                      </div>
                      <div className="grid gap-1.5 text-xs uppercase tracking-[0.24em] text-white/40">
                        <div>Effective {formatDate(currentEmployee.pay.effective)}</div>
                        {currentEmployee.pay.type === "HOURLY" ? (
                          <div>OT {currentEmployee.pay.otMultiplier ?? 1.5}x</div>
                        ) : (
                          <div>Salary (weekly)</div>
                        )}
                        <div>Next Review {formatDate(addDays(currentEmployee.pay.effective, 180))}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                        Rate History
                      </div>
                      <div className="max-h-36 space-y-2 overflow-auto pr-1 text-sm">
                        {currentEmployee.rateHistory.map((entry, index) => (
                          <div
                            key={`${entry.effective}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                          >
                            <span className="text-white/70">{formatPay(entry)}</span>
                            <span className="text-xs text-white/30">{formatDate(entry.effective)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* CREDENTIALS */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                    Credentials
                  </h3>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {editMode ? (
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                          <input
                            type="checkbox"
                            checked={profileDraft.cdl ?? false}
                            onChange={(e) =>
                              setProfileDraft((prev) => ({ ...prev, cdl: e.target.checked }))
                            }
                            className="h-4 w-4 rounded border border-white/20 bg-white/5 accent-emerald-400"
                          />
                          CDL
                        </label>
                      ) : (
                        <>
                          {currentEmployee.cdl ? (
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-200">CDL</Badge>
                          ) : null}
                          {currentEmployee.certs?.map((cert) => (
                            <Badge key={cert.code} variant="secondary" className="bg-white/10 text-white/60">
                              {cert.label}
                              {cert.expires ? (
                                <span className="ml-2 text-xs text-white/30">
                                  exp {formatDate(cert.expires)}
                                </span>
                              ) : null}
                            </Badge>
                          ))}
                          {!currentEmployee.cdl && !currentEmployee.certs?.length ? (
                            <span className="text-xs text-white/30">No certifications recorded.</span>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </section>

                {/* NOTES */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Notes</h3>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Textarea
                      value={editMode ? (profileDraft.notes ?? "") : (currentEmployee.notes ?? "")}
                      readOnly={!editMode}
                      onChange={
                        editMode
                          ? (e) => setProfileDraft((prev) => ({ ...prev, notes: e.target.value }))
                          : undefined
                      }
                      placeholder={
                        editMode ? "Performance, certifications, reminders…" : "No notes recorded."
                      }
                      className={cn(
                        "min-h-[100px] resize-none bg-transparent border-transparent text-white placeholder:text-white/25",
                        !editMode && "cursor-default opacity-70",
                      )}
                    />
                  </div>
                </section>
              </div>

              {/* ── Footer ───────────────────────────────────────────────── */}
              <div className="relative z-10 flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-6 py-4">
                <button
                  type="button"
                  disabled={editMode}
                  onClick={() => {
                    setTerminateDraft({
                      reason: "",
                      notes: "",
                      effectiveDate: new Date().toISOString().slice(0, 10),
                    });
                    setTerminateDialog({ open: true, employeeId: currentEmployee.id });
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-400/80 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Terminate
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={editMode}
                    className="border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
                    onClick={() => setPayDialog({ open: true, employeeId: currentEmployee.id })}
                  >
                    Edit Pay
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={editMode}
                    className="border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
                    onClick={() => setAssignDialog({ open: true, employeeId: currentEmployee.id })}
                  >
                    Assign Crew
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Terminate Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={terminateDialog.open}
        onOpenChange={(open) => {
          if (!open) setTerminateDialog({ open: false });
        }}
      >
        <DialogContent className="max-w-md bg-[rgba(23,23,23,0.6)] backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(3,6,23,0.55)] text-white [&>button.absolute]:text-white/40 [&>button.absolute]:hover:text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Terminate Employee
            </DialogTitle>
            <DialogDescription className="text-white/40">
              {terminateDialog.employeeId
                ? employees.find((e) => e.id === terminateDialog.employeeId)?.name
                : ""}
              {" — "}This action will mark the employee as terminated.
            </DialogDescription>
          </DialogHeader>
          <form
            className="relative grid gap-4 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              const empId = terminateDialog.employeeId;
              if (!empId) return;
              onSetStatus(empId, "TERMINATED");
              const logLine = `[Terminated ${terminateDraft.effectiveDate}] Reason: ${terminateDraft.reason}${terminateDraft.notes ? ` — ${terminateDraft.notes}` : ""}`;
              setEmployee(empId, (emp) => ({
                ...emp,
                notes: [emp.notes, logLine].filter(Boolean).join("\n"),
              }));
              setTerminateDialog({ open: false });
              setTerminateDraft({ reason: "", notes: "", effectiveDate: new Date().toISOString().slice(0, 10) });
              setSheetOpen(false);
              setDrawerId(null);
              setEditMode(false);
            }}
          >
            <Select
              label="Reason"
              value={terminateDraft.reason}
              onChange={(e) => setTerminateDraft((prev) => ({ ...prev, reason: e.target.value }))}
              required
            >
              <option value="">Select a reason…</option>
              <option value="Resignation">Resignation</option>
              <option value="Layoff">Layoff</option>
              <option value="Performance">Performance</option>
              <option value="End of Contract">End of Contract</option>
              <option value="Other">Other</option>
            </Select>
            <label className="grid gap-1 text-sm text-white/50">
              Details
              {terminateDraft.reason === "Other" && (
                <span className="text-red-400 text-xs"> (required)</span>
              )}
              <Textarea
                value={terminateDraft.notes}
                onChange={(e) =>
                  setTerminateDraft((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional context…"
                required={terminateDraft.reason === "Other"}
                className="min-h-[80px] resize-none bg-white/5 border-white/15 text-white placeholder:text-white/25"
              />
            </label>
            <label className="grid gap-1 text-sm text-white/50">
              Effective Date
              <Input
                type="date"
                value={terminateDraft.effectiveDate}
                onChange={(e) =>
                  setTerminateDraft((prev) => ({ ...prev, effectiveDate: e.target.value }))
                }
                required
                className="bg-white/5 border-white/15 text-white"
              />
            </label>
            <DialogFooter className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setTerminateDialog({ open: false })}
                className="text-white/50 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !terminateDraft.reason ||
                  (terminateDraft.reason === "Other" && !terminateDraft.notes) ||
                  !terminateDraft.effectiveDate
                }
                className="bg-red-500/20 text-red-300 ring-1 ring-red-500/30 hover:bg-red-500/30 disabled:opacity-40"
              >
                Confirm Termination
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={payDialog.open} onOpenChange={(open) => setPayDialog({ open })}>
        <DialogContent className="max-w-xl bg-surface-soft text-foreground">
          <DialogHeader>
            <DialogTitle>Edit Pay</DialogTitle>
            <DialogDescription>
              Update pay details. A new rate entry is added to history automatically.
            </DialogDescription>
          </DialogHeader>
          {payDialogEmployee && payDraft ? (
            <form
              className="grid gap-4 py-2"
              onSubmit={(event) => {
                event.preventDefault();
                onEditPay(payDialogEmployee.id, payDraft);
                setPayDialog({ open: false });
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Select
                  label="Type"
                  value={payDraft.type}
                  onChange={(event) => {
                    const nextType = event.target.value as PayType;
                    setPayDraft((prev) =>
                      prev
                        ? {
                            type: nextType,
                            base: prev.base,
                            otMultiplier: nextType === "HOURLY" ? prev.otMultiplier ?? 1.5 : undefined,
                            effective: prev.effective,
                          }
                        : prev,
                    );
                  }}
                >
                  <option value="HOURLY">Hourly</option>
                  <option value="SALARY">Salary (weekly)</option>
                </Select>
                <label className="text-sm text-muted">
                  Base Rate
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={payDraft.base}
                    onChange={(event) =>
                      setPayDraft((prev) =>
                        prev ? { ...prev, base: Number(event.target.value) } : prev,
                      )
                    }
                    className="mt-1"
                  />
                </label>
              </div>
              {payDraft.type === "HOURLY" ? (
                <label className="text-sm text-muted">
                  OT Multiplier
                  <Input
                    type="number"
                    min={1}
                    step="0.1"
                    value={payDraft.otMultiplier ?? 1.5}
                    onChange={(event) =>
                      setPayDraft((prev) =>
                        prev
                          ? { ...prev, otMultiplier: Number(event.target.value) }
                          : prev,
                      )
                    }
                    className="mt-1"
                  />
                </label>
              ) : null}
              <label className="text-sm text-muted">
                Effective Date
                <Input
                  type="date"
                  value={payDraft.effective}
                  onChange={(event) =>
                    setPayDraft((prev) =>
                      prev ? { ...prev, effective: event.target.value } : prev,
                    )
                  }
                  className="mt-1"
                />
              </label>
              <DialogFooter className="pt-2">
                <Button type="submit">Save Pay</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ open })}>
        <DialogContent className="max-w-md bg-surface-soft text-foreground">
          <DialogHeader>
            <DialogTitle>Assign Crew</DialogTitle>
            <DialogDescription>
              Choose an existing crew or type a new crew assignment.
            </DialogDescription>
          </DialogHeader>
          {assignDialogEmployee ? (
            <form
              className="grid gap-4 py-2"
              onSubmit={(event) => {
                event.preventDefault();
                onAssignCrew(assignDialogEmployee.id, assignCrewDraft);
                setAssignDialog({ open: false });
              }}
            >
              <Select
                label="Crew"
                value={assignCrewDraft || ""}
                onChange={(event) => setAssignCrewDraft(event.target.value)}
              >
                <option value="">Unassigned</option>
                {crews.map((crew) => (
                  <option key={crew} value={crew}>
                    {crew}
                  </option>
                ))}
              </Select>
              <DialogFooter className="pt-2">
                <Button type="submit">Assign</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAssignDialog} onOpenChange={setBulkAssignDialog}>
        <DialogContent className="max-w-md bg-surface-soft text-foreground">
          <DialogHeader>
            <DialogTitle>Bulk Assign Crew</DialogTitle>
            <DialogDescription>
              Apply a crew assignment to all selected team members.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 py-2"
            onSubmit={(event) => {
              event.preventDefault();
              onBulkAssignCrew(bulkAssignCrewDraft);
              setBulkAssignDialog(false);
              setBulkAssignCrewDraft("");
            }}
          >
            <Select
              label="Crew"
              value={bulkAssignCrewDraft}
              onChange={(event) => setBulkAssignCrewDraft(event.target.value)}
            >
              <option value="">Unassigned</option>
              {crews.map((crew) => (
                <option key={crew} value={crew}>
                  {crew}
                </option>
              ))}
            </Select>
            <DialogFooter className="pt-2">
              <Button type="submit">Apply to Selected</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ open })}>
        <DialogContent className="max-w-md bg-surface-soft text-foreground">
          <DialogHeader>
            <DialogTitle>{statusDialogLabel}</DialogTitle>
            <DialogDescription>
              Position team members for scheduling, payroll, and roster updates.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {(Object.keys(statusLabels) as EmpStatus[]).map((status) => (
              <Button
                key={status}
                variant="outline"
                className="justify-between"
                onClick={() => {
                  if (statusDialog.bulk) {
                    onBulkSetStatus(status);
                  } else if (statusDialog.employeeId) {
                    onSetStatus(statusDialog.employeeId, status);
                  }
                  setStatusDialog({ open: false });
                }}
              >
                {statusLabels[status]}
                <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusDialog({ open: false })}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent className="max-w-3xl bg-surface-soft text-foreground">
          <DialogHeader>
            <DialogTitle>New Employee</DialogTitle>
            <DialogDescription>
              Capture the basics. This record stays local until synced with HRIS.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleNewEmployeeSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-muted">
                Name
                <Input name="name" placeholder="Full name" required />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                Email
                <Input name="email" type="email" placeholder="name@company.com" />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                Phone
                <Input name="phone" placeholder="305-555-0101" />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                Hire Date
                <Input name="hireDate" type="date" />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                Crew
                <Input name="crew" placeholder="Guardrail A" />
              </label>
              <Select label="Role" name="role" defaultValue="Labor">
                <option value="Foreman">Foreman</option>
                <option value="Skilled Labor">Skilled Labor</option>
                <option value="Labor">Labor</option>
                <option value="Yard">Yard</option>
                <option value="Driver">Driver</option>
                <option value="Welder">Welder</option>
              </Select>
              <Select label="Status" name="status" defaultValue="ACTIVE">
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </Select>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  name="cdl"
                  className="h-4 w-4 rounded border border-border bg-card accent-accent"
                />
                CDL
              </label>
            </div>
            <Separator className="border-border/60" />
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Pay Type" name="payType" defaultValue="HOURLY">
                <option value="HOURLY">Hourly</option>
                <option value="SALARY">Salary (weekly)</option>
              </Select>
              <label className="grid gap-1 text-sm text-muted">
                Base Pay
                <Input
                  name="payBase"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="24"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                OT Multiplier
                <Input name="payOt" type="number" step="0.1" min={1} placeholder="1.5" />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                Effective Date
                <Input name="payEffective" type="date" />
              </label>
            </div>
            <label className="grid gap-1 text-sm text-muted">
              Notes
              <Textarea name="notes" placeholder="Optional roster, certifications, equipment notes." />
            </label>
            <DialogFooter>
              <Button type="submit">Create Employee</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
