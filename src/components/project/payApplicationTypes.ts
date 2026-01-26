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
  payItem: string;
  description: string;
  quantity: number;
  installedQty: number;
};

export type Phase = {
  id: string;
  name: string;
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
