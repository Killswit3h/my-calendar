export type ChecklistStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export type ChecklistItem = {
  key: string;
  label: string;
};

export type StockpileEntry = {
  id: string;
  payItem: string;
  description: string;
  quantity: number;
  amount: number;
};

export type PhaseItem = {
  id: string;
  /** Persisted `project_pay_item.id`; null when the pay line is not saved yet */
  projectPayItemId: number | null;
  payItem: string;
  /** Contract pay line description (reference; from pay item) */
  description: string;
  /** Per-phase line note persisted as `project_phase_line.line_description` */
  lineDescription: string;
  /** Mirror of contract `contracted_quantity` for caps and allocation hints */
  contractedQuantity: number;
  quantity: number;
  installedQty: number;
};

export type Phase = {
  id: string;
  name: string;
  /** Client-only invoice letter suffix (UI from pay application header INV#) */
  invoiceSuffix: string;
  locateTicket: string;
  dateCreated: string;
  readyToWorkDate: string;
  onsiteReview: boolean;
  surveyed: boolean;
  status: string;
  statusDate: string;
  notes?: string;
  items: PhaseItem[];
};

export type NewContractItem = {
  payItem: string;
  description: string;
  contractQty: string;
  installedQty: string;
};
