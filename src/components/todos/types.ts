export type SmartViewKey = "myday" | "important" | "planned";

export type ActiveView =
  | { type: "smart"; key: SmartViewKey }
  | { type: "list"; id: string };

export type TodoStepModel = {
  id: string;
  title: string;
  isCompleted: boolean;
  position: number;
};

export type TodoItemModel = {
  id: string;
  title: string;
  note: string | null;
  isCompleted: boolean;
  isImportant: boolean;
  myDay: boolean;
  dueAt: string | null;
  allDay: boolean;
  dueDate: string | null;
  remindAt: string | null;
  repeatRule: string | null;
  reminderEnabled: boolean;
  reminderOffsets: number[];
  lastNotifiedAt: string | null;
  sortOrder: number;
  position: number;
  createdAt: string;
  updatedAt: string;
  listId: string;
  steps: TodoStepModel[];
};

export type PlannedGroup = {
  key: string;
  label: string;
  items: TodoItemModel[];
};

export type TodoListSummary = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  position: number;
  isSmart: boolean;
  incompleteCount: number;
  notificationEmail: string | null;
  notifyOnNewTask: boolean;
};

export type SortOption = "manual" | "importance" | "due-date" | "alphabetical" | "created";
export type GroupOption = "none" | "due-date";
