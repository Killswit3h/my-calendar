"use client";

import { useCallback, useEffect, useMemo, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import {
  BadgeCheck,
  Check,
  ClipboardList,
  PackageCheck,
  Plus,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import Card from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/Select";

type Status = "AVAILABLE" | "CHECKED_OUT" | "NEEDS_SERVICE";

type Category =
  | "Power Tools"
  | "Hand Tools"
  | "Sockets & Bits"
  | "Measuring & Layout"
  | "Power & Cords"
  | "Heavy Equipment"
  | "Accessories";

interface Item {
  id: string;
  name: string;
  category: Category;
  qty: number;
  status: Status;
  assignedTo?: string;
  tags?: string[];
  notes?: string;
  lastActivity?: string;
}

type Filters = {
  status: Status | "ALL";
  category: Category | "ALL";
};

const categories: Category[] = [
  "Power Tools",
  "Hand Tools",
  "Sockets & Bits",
  "Measuring & Layout",
  "Power & Cords",
  "Heavy Equipment",
  "Accessories",
];

const statusLabels: Record<Status, string> = {
  AVAILABLE: "Available",
  CHECKED_OUT: "Checked Out",
  NEEDS_SERVICE: "Needs Service",
};

const statusBadgeVariant: Record<Status, "success" | "warning" | "destructive"> =
  {
    AVAILABLE: "success",
    CHECKED_OUT: "warning",
    NEEDS_SERVICE: "destructive",
  };

const seedItems: Array<Omit<Item, "id">> = [
  {
    name: "Hilti impact drill 3/8",
    category: "Power Tools",
    qty: 3,
    status: "CHECKED_OUT",
    assignedTo: "Guardrail Crew A",
    tags: ["guardrail-kit"],
    notes: "Issued for west lot install.",
    lastActivity: "Checked out Oct 19 · 7:45 AM",
  },
  {
    name: "Hilti concrete saw",
    category: "Power Tools",
    qty: 2,
    status: "NEEDS_SERVICE",
    assignedTo: "Service Bay",
    tags: ["guardrail-kit"],
    notes: "Blade guard requires replacement.",
    lastActivity: "Flagged for service Oct 18 · 4:10 PM",
  },
  {
    name: "Hilti Drill",
    category: "Power Tools",
    qty: 4,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    tags: ["guardrail-kit"],
    lastActivity: "Checked in Oct 18 · 5:12 PM",
  },
  {
    name: "Hilti Batteries",
    category: "Accessories",
    qty: 12,
    status: "AVAILABLE",
    assignedTo: "Battery Cart",
    tags: ["guardrail-kit"],
    lastActivity: "Charged Oct 19 · 6:50 AM",
  },
  {
    name: "Hilti Chargers",
    category: "Accessories",
    qty: 4,
    status: "AVAILABLE",
    assignedTo: "Battery Station",
    tags: ["guardrail-kit"],
    lastActivity: "Cycle complete Oct 18 · 9:30 PM",
  },
  {
    name: 'Socket extension 5"',
    category: "Sockets & Bits",
    qty: 6,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    tags: ["guardrail-kit"],
    lastActivity: "Inspected Oct 17 · 3:05 PM",
  },
  {
    name: "Socket 38 MM",
    category: "Sockets & Bits",
    qty: 5,
    status: "CHECKED_OUT",
    assignedTo: "Truck 12",
    tags: ["guardrail-kit"],
    lastActivity: "Loaded on Truck 12 Oct 19 · 6:20 AM",
  },
  {
    name: "Custom Type II Socket",
    category: "Sockets & Bits",
    qty: 3,
    status: "AVAILABLE",
    assignedTo: "Fabrication",
    tags: ["guardrail-kit"],
    notes: "Custom machined adapter.",
    lastActivity: "Inspected Oct 16 · 10:15 AM",
  },
  {
    name: "Tape Measure",
    category: "Measuring & Layout",
    qty: 8,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    lastActivity: "Returned Oct 19 · 5:55 AM",
  },
  {
    name: "Sledge hammer",
    category: "Hand Tools",
    qty: 4,
    status: "CHECKED_OUT",
    assignedTo: "Guardrail Crew B",
    tags: ["guardrail-kit"],
    lastActivity: "Checked out Oct 19 · 7:02 AM",
  },
  {
    name: "Hole puncher/aligner",
    category: "Hand Tools",
    qty: 2,
    status: "AVAILABLE",
    tags: ["guardrail-kit"],
    assignedTo: "Tool Cage",
    lastActivity: "Checked in Oct 18 · 4:46 PM",
  },
  {
    name: "Post puller attachment",
    category: "Heavy Equipment",
    qty: 1,
    status: "AVAILABLE",
    assignedTo: "Yard Crane",
    tags: ["guardrail-kit"],
    lastActivity: "Inspected Oct 17 · 8:10 AM",
  },
  {
    name: "Ratchet Binder",
    category: "Accessories",
    qty: 6,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    tags: ["guardrail-kit"],
    lastActivity: "Lubricated Oct 18 · 11:00 AM",
  },
  {
    name: "Adjustment wrench",
    category: "Hand Tools",
    qty: 5,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    tags: ["guardrail-kit"],
    lastActivity: "Issued Oct 15 · 9:20 AM",
  },
  {
    name: "Pipe wrench",
    category: "Hand Tools",
    qty: 3,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    lastActivity: "Inspected Oct 14 · 2:30 PM",
  },
  {
    name: "Rotary/hammer drill",
    category: "Power Tools",
    qty: 2,
    status: "NEEDS_SERVICE",
    assignedTo: "Service Bay",
    lastActivity: "Motor overheating Oct 17 · 5:25 PM",
  },
  {
    name: "Bauer cable drill",
    category: "Power Tools",
    qty: 1,
    status: "CHECKED_OUT",
    assignedTo: "Guardrail Crew A",
    tags: ["guardrail-kit"],
    lastActivity: "Deployed Oct 19 · 6:58 AM",
  },
  {
    name: "Extension cord 100 FT",
    category: "Power & Cords",
    qty: 7,
    status: "AVAILABLE",
    assignedTo: "Power Rack",
    lastActivity: "Tested Oct 18 · 1:15 PM",
  },
  {
    name: "Generator",
    category: "Heavy Equipment",
    qty: 2,
    status: "CHECKED_OUT",
    assignedTo: "Guardrail Crew C",
    lastActivity: "Fuelled Oct 19 · 6:30 AM",
  },
  {
    name: "Double socket wrench",
    category: "Hand Tools",
    qty: 3,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    lastActivity: "Polished Oct 18 · 9:10 AM",
  },
  {
    name: 'Hole saw bits 7/8"',
    category: "Sockets & Bits",
    qty: 10,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    lastActivity: "Resharpened Oct 17 · 11:40 AM",
  },
  {
    name: "Socket set",
    category: "Sockets & Bits",
    qty: 4,
    status: "CHECKED_OUT",
    assignedTo: "Truck 14",
    lastActivity: "Issued Oct 18 · 6:05 PM",
  },
  {
    name: "Straps",
    category: "Accessories",
    qty: 12,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    tags: ["guardrail-kit"],
    lastActivity: "Inspected Oct 16 · 4:00 PM",
  },
  {
    name: "Come along",
    category: "Accessories",
    qty: 3,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    tags: ["guardrail-kit"],
    lastActivity: "Lubricated Oct 18 · 7:20 AM",
  },
  {
    name: 'Drill bit 7/8" rotary hammer drill',
    category: "Sockets & Bits",
    qty: 6,
    status: "AVAILABLE",
    assignedTo: "Tool Cage",
    tags: ["guardrail-kit"],
    lastActivity: "Sharpened Oct 18 · 10:45 AM",
  },
  {
    name: "Markers",
    category: "Accessories",
    qty: 15,
    status: "AVAILABLE",
    assignedTo: "Layout Bin",
    lastActivity: "Restocked Oct 18 · 3:30 PM",
  },
  {
    name: "String",
    category: "Accessories",
    qty: 9,
    status: "AVAILABLE",
    assignedTo: "Layout Bin",
    lastActivity: "Restocked Oct 18 · 3:30 PM",
  },
  {
    name: "3' Level",
    category: "Measuring & Layout",
    qty: 4,
    status: "CHECKED_OUT",
    assignedTo: "Guardrail Crew B",
    tags: ["guardrail-kit"],
    lastActivity: "Checked out Oct 19 · 7:05 AM",
  },
];

const initialItems: Item[] = seedItems.map((item) => ({
  ...item,
  id: `inv-${slugify(item.name)}`,
}));

const statusOptions: Array<{ value: Status | "ALL"; label: string }> = [
  { value: "ALL", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "CHECKED_OUT", label: "Checked Out" },
  { value: "NEEDS_SERVICE", label: "Needs Service" },
];

const categoryOptions: Array<{ value: Category | "ALL"; label: string }> = [
  { value: "ALL", label: "All Categories" },
  ...categories.map((category) => ({ value: category, label: category })),
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const formatTimestamp = () =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

interface InventoryCheckboxProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function InventoryCheckbox({
  checked,
  onCheckedChange,
  className,
  onClick,
  ...props
}: InventoryCheckboxProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(event);
    if (event.defaultPrevented) return;
    onCheckedChange(!checked);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={handleClick}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-transparent transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        checked ? "border-accent bg-accent text-background" : "",
        className,
      )}
      {...props}
    >
      <span className="sr-only">{checked ? "Deselect item" : "Select item"}</span>
      {checked ? <Check className="h-3.5 w-3.5" /> : null}
    </button>
  );
}

export default function InventoryShelf() {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    status: "ALL",
    category: "ALL",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newItemDraft, setNewItemDraft] = useState<{
    name: string;
    qty: number;
    status: Status;
    category: Category;
    notes: string;
  }>({
    name: "",
    qty: 1,
    status: "AVAILABLE",
    category: "Power Tools",
    notes: "",
  });

  const onSearch = useCallback((value: string) => {
    console.log("inventory:search", value);
  }, []);

  const onFilterChange = useCallback((value: Filters) => {
    console.log("inventory:filters", value);
  }, []);

  const onCheckOut = useCallback((id: string) => {
    console.log("inventory:checkout", id);
  }, []);

  const onCheckIn = useCallback((id: string) => {
    console.log("inventory:checkin", id);
  }, []);

  const onTransfer = useCallback((id: string) => {
    console.log("inventory:transfer", id);
  }, []);

  const onService = useCallback((id: string) => {
    console.log("inventory:service", id);
  }, []);

  const onCreateItem = useCallback((item: Item) => {
    console.log("inventory:create", item);
  }, []);

  const onCreatePickTicket = useCallback(() => {
    console.log("inventory:create-pick-ticket", selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => items.some((item) => item.id === id)),
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.assignedTo &&
          item.assignedTo.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus =
        filters.status === "ALL" || item.status === filters.status;
      const matchesCategory =
        filters.category === "ALL" || item.category === filters.category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [items, query, filters]);

  const guardrailKitIds = useMemo(
    () =>
      items
        .filter((item) => item.tags?.includes("guardrail-kit"))
        .map((item) => item.id),
    [items],
  );

  const handleSearchChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleStatusChange = (value: Status | "ALL") => {
    const nextFilters = { ...filters, status: value };
    setFilters(nextFilters);
    onFilterChange(nextFilters);
  };

  const handleCategoryChange = (value: Category | "ALL") => {
    const nextFilters = { ...filters, category: value };
    setFilters(nextFilters);
    onFilterChange(nextFilters);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (nextState: boolean) => {
    if (nextState) {
      setSelectedIds(filteredItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const applyToItems = useCallback(
    (ids: string[], mutator: (item: Item) => Item) => {
      if (!ids.length) return;
      setItems((prev) => {
        const next = prev.map((item) =>
          ids.includes(item.id) ? mutator(item) : item,
        );
        if (activeItem) {
          const updated = next.find((item) => item.id === activeItem.id) || null;
          Promise.resolve().then(() => setActiveItem(updated));
        }
        return next;
      });
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    },
    [activeItem],
  );

  const handleCheckOut = (ids: string[]) => {
    const timestamp = formatTimestamp();
    applyToItems(ids, (item) => ({
      ...item,
      status: "CHECKED_OUT",
      assignedTo: item.assignedTo || "Guardrail Crew",
      lastActivity: `Checked out ${timestamp}`,
    }));
    ids.forEach(onCheckOut);
  };

  const handleCheckIn = (ids: string[]) => {
    const timestamp = formatTimestamp();
    applyToItems(ids, (item) => ({
      ...item,
      status: "AVAILABLE",
      assignedTo: "Tool Cage",
      lastActivity: `Checked in ${timestamp}`,
    }));
    ids.forEach(onCheckIn);
  };

  const handleTransfer = (ids: string[]) => {
    const timestamp = formatTimestamp();
    applyToItems(ids, (item) => ({
      ...item,
      status: "CHECKED_OUT",
      assignedTo: "Truck 12",
      lastActivity: `Transferred ${timestamp}`,
    }));
    ids.forEach(onTransfer);
  };

  const handleService = (ids: string[]) => {
    const timestamp = formatTimestamp();
    applyToItems(ids, (item) => ({
      ...item,
      status: "NEEDS_SERVICE",
      assignedTo: "Service Bay",
      lastActivity: `Sent to service ${timestamp}`,
    }));
    ids.forEach(onService);
  };

  const handleOpenDetails = (item: Item) => {
    setActiveItem(item);
    setSheetOpen(true);
  };

  const handleAddItem = () => {
    if (!newItemDraft.name.trim()) return;
    const newItem: Item = {
      id: `inv-${slugify(newItemDraft.name)}-${Date.now()}`,
      name: newItemDraft.name.trim(),
      qty: Math.max(1, Number(newItemDraft.qty)),
      category: newItemDraft.category,
      status: newItemDraft.status,
      notes: newItemDraft.notes ? newItemDraft.notes.trim() : undefined,
      assignedTo:
        newItemDraft.status === "AVAILABLE" ? "Tool Cage" : "Guardrail Crew",
      lastActivity: `Added ${formatTimestamp()}`,
    };
    setItems((prev) => [newItem, ...prev]);
    onCreateItem(newItem);
    setAddOpen(false);
    setNewItemDraft({
      name: "",
      qty: 1,
      status: "AVAILABLE",
      category: "Power Tools",
      notes: "",
    });
  };

  const handleAssembleKit = () => {
    setSelectedIds(guardrailKitIds);
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface-soft px-5 py-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search tools, assignments, or notes..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
            <Select
              label="Status"
              value={filters.status}
              onChange={(event) =>
                handleStatusChange(event.target.value as Status | "ALL")
              }
              className="min-w-[160px]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Category"
              value={filters.category}
              onChange={(event) =>
                handleCategoryChange(event.target.value as Category | "ALL")
              }
              className="min-w-[180px]"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            <BadgeCheck className="h-4 w-4 text-accent" />
            <span>
              {filteredItems.length} item
              {filteredItems.length === 1 ? "" : "s"} ready for the Guardrail &
              Fence crew
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleAssembleKit}
            >
              <Sparkles className="h-4 w-4" />
              Assemble Guardrail Kit
            </Button>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogContent className="max-w-2xl bg-surface-soft">
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                  <DialogDescription>
                    Capture a new tool or piece of equipment and assign it to the
                    Guardrail shelf. These items stay local until synced.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-muted">Name</span>
                    <Input
                      value={newItemDraft.name}
                      onChange={(event) =>
                        setNewItemDraft((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Guardrail tensioner"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-muted">Quantity</span>
                    <Input
                      type="number"
                      min={1}
                      value={newItemDraft.qty}
                      onChange={(event) =>
                        setNewItemDraft((prev) => ({
                          ...prev,
                          qty: Number(event.target.value || 1),
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-muted">Status</span>
                    <select
                      value={newItemDraft.status}
                      onChange={(event) =>
                        setNewItemDraft((prev) => ({
                          ...prev,
                          status: event.target.value as Status,
                        }))
                      }
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="CHECKED_OUT">Checked Out</option>
                      <option value="NEEDS_SERVICE">Needs Service</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-muted">Category</span>
                    <select
                      value={newItemDraft.category}
                      onChange={(event) =>
                        setNewItemDraft((prev) => ({
                          ...prev,
                          category: event.target.value as Category,
                        }))
                      }
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="space-y-2 text-sm">
                  <span className="text-muted">Notes</span>
                  <Textarea
                    value={newItemDraft.notes}
                    onChange={(event) =>
                      setNewItemDraft((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Add any contextual notes, maintenance reminders, or storage location."
                  />
                </label>
                <DialogFooter className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddItem}
                    disabled={!newItemDraft.name.trim()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Save Item
                  </Button>
                </DialogFooter>
              </DialogContent>
              <Button
                variant="default"
                className="gap-2"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </Dialog>
          </div>
        </div>
      </div>

      <Card tone="glass" padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <ClipboardList className="h-4 w-4 text-accent" />
            <span>Table view</span>
          </div>
          <div className="flex items-center gap-2">
            <InventoryCheckbox
              checked={
                filteredItems.length > 0 &&
                selectedIds.length === filteredItems.length
              }
              onCheckedChange={(checked) => toggleSelectAll(checked)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    selected ? "bg-accent/10" : "",
                    "border-border/50",
                  )}
                >
                  <TableCell>
                    <InventoryCheckbox
                      checked={selected}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="text-left transition hover:text-accent"
                      onClick={() => handleOpenDetails(item)}
                    >
                      {item.name}
                    </button>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[item.status]}>
                      {statusLabels[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.assignedTo ?? "—"}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.lastActivity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckOut([item.id])}
                      >
                        Check-Out
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckIn([item.id])}
                      >
                        Check-In
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTransfer([item.id])}
                      >
                        Transfer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {hasSelection ? (
        <div className="fixed bottom-6 left-1/2 z-30 w-full max-w-3xl -translate-x-1/2 rounded-2xl border border-border/60 bg-surface-soft/95 px-4 py-3 shadow-[0_24px_80px_rgba(6,16,10,0.36)] backdrop-blur-sm transition">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <PackageCheck className="h-4 w-4 text-accent" />
              <span>
                {selectedIds.length} selected ·{" "}
                {selectedItems
                  .map((item) => item.name)
                  .slice(0, 3)
                  .join(", ")}
                {selectedItems.length > 3 ? "…" : ""}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCheckOut(selectedIds)}
              >
                Check-Out
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCheckIn(selectedIds)}
              >
                Check-In
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTransfer(selectedIds)}
              >
                Transfer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleService(selectedIds)}
              >
                Service
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onCreatePickTicket();
                  window.alert("Pick ticket drafted for Guardrail kit.");
                }}
                className="bg-accent text-white hover:bg-accent/90"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Create Pick Ticket
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Sheet
        open={sheetOpen && Boolean(activeItem)}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setActiveItem(null);
        }}
      >
        <SheetContent className="border-l border-border/60 bg-surface-soft/95 backdrop-blur-xl">
          {activeItem ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Inventory Details
                  </span>
                  <span>{activeItem.name}</span>
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant[activeItem.status]}>
                    {statusLabels[activeItem.status]}
                  </Badge>
                  <Badge variant="secondary">{activeItem.category}</Badge>
                </div>
              </SheetHeader>
              <SheetBody className="space-y-6 text-sm text-muted">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-2xl border border-border/50 bg-foreground/5 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      Assignment
                    </div>
                    <div className="flex items-center gap-2 text-base text-foreground">
                      <Truck className="h-4 w-4 text-accent" />
                      <span>{activeItem.assignedTo ?? "Unassigned"}</span>
                    </div>
                    <div>Qty in stock: {activeItem.qty}</div>
                    <div>Last activity: {activeItem.lastActivity}</div>
                  </div>
                  <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/60 p-4 text-center">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                      QR Code
                    </span>
                    <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl border border-border/60 bg-background/40 text-muted">
                      Scan tag
                    </div>
                    <p className="text-xs text-muted">
                      Attach this code to speed up guardrail kit pulls in the
                      yard.
                    </p>
                  </div>
                </div>

                {activeItem.notes ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      Notes
                    </div>
                    <p className="rounded-xl bg-foreground/5 px-4 py-3 text-sm text-foreground/80">
                      {activeItem.notes}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Quick actions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleCheckOut([activeItem.id])}
                    >
                      Check-Out
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCheckIn([activeItem.id])}
                    >
                      Check-In
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTransfer([activeItem.id])}
                    >
                      Transfer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleService([activeItem.id])}
                    >
                      Service
                    </Button>
                    <Button
                      onClick={() => {
                        onCreatePickTicket();
                        window.alert(
                          `Pick ticket created for ${activeItem.name}.`,
                        );
                      }}
                      className="bg-accent text-white hover:bg-accent/90"
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Create Pick Ticket
                    </Button>
                  </div>
                </div>
              </SheetBody>
              <SheetFooter className="flex flex-wrap justify-between gap-2">
                <div className="text-xs text-muted">
                  Guardrail shelf · Updated {activeItem.lastActivity}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setSheetOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => handleCheckOut([activeItem.id])}>
                    Reserve for Crew
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
