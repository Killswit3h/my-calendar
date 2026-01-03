export type Company = {
  id: string;
  name: string;
};

export type ProjectType = "HANDRAIL" | "GUARDRAIL" | "FENCE" | "OTHER";

export type Project = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  status: "ACTIVE" | "COMPLETED";
  owner: string;
  district: string;
  projectType: ProjectType;
};

export const COMPANIES: Company[] = [
  { id: "gfc", name: "Guaranteed Fence Corp" },
  { id: "halley", name: "Halley Engineering" },
  { id: "northbay", name: "NorthBay Infrastructure" },
  { id: "pioneer", name: "Pioneer Civil Group" },
  { id: "sunbound", name: "Sunbound Constructors" },
];

export const PROJECTS: Project[] = [
  {
    id: "gfc-e8w48",
    companyId: "gfc",
    code: "E8W48",
    name: "I-95 Express Phase 3C",
    status: "ACTIVE",
    owner: "FDOT District 6",
    district: "D6",
    projectType: "GUARDRAIL",
  },
  {
    id: "gfc-m11a2",
    companyId: "gfc",
    code: "M11A2",
    name: "SR-836 Shoulder Retrofit",
    status: "ACTIVE",
    owner: "Miami-Dade Expressway",
    district: "D6",
    projectType: "HANDRAIL",
  },
  {
    id: "gfc-l4n03",
    companyId: "gfc",
    code: "L4N03",
    name: "Port Everglades Gate Modernization",
    status: "COMPLETED",
    owner: "Port Everglades",
    district: "Private",
    projectType: "FENCE",
  },
  {
    id: "halley-a21f1",
    companyId: "halley",
    code: "A21F1",
    name: "Stadium Perimeter Fence Package",
    status: "ACTIVE",
    owner: "City of Tampa",
    district: "D7",
    projectType: "FENCE",
  },
  {
    id: "halley-q08c9",
    companyId: "halley",
    code: "Q08C9",
    name: "Palm Grove Transit Hub",
    status: "COMPLETED",
    owner: "Palm Grove County",
    district: "D4",
    projectType: "OTHER",
  },
  {
    id: "northbay-h7d20",
    companyId: "northbay",
    code: "H7D20",
    name: "Coastal Surge Wall Pilot",
    status: "ACTIVE",
    owner: "FDOT District 4",
    district: "D4",
    projectType: "HANDRAIL",
  },
  {
    id: "northbay-p4k77",
    companyId: "northbay",
    code: "P4K77",
    name: "Biscayne Greenway Segment A",
    status: "COMPLETED",
    owner: "Biscayne MPO",
    district: "D6",
    projectType: "GUARDRAIL",
  },
  {
    id: "pioneer-v3d91",
    companyId: "pioneer",
    code: "V3D91",
    name: "Phoenix Creek Bridge Rehab",
    status: "ACTIVE",
    owner: "FDOT District 5",
    district: "D5",
    projectType: "OTHER",
  },
  {
    id: "pioneer-t2m04",
    companyId: "pioneer",
    code: "T2M04",
    name: "Downtown Streetscape Phase 2",
    status: "COMPLETED",
    owner: "City of Orlando",
    district: "D5",
    projectType: "HANDRAIL",
  },
  {
    id: "sunbound-n6q55",
    companyId: "sunbound",
    code: "N6Q55",
    name: "Brightline Expansion Stage 1",
    status: "ACTIVE",
    owner: "Brightline",
    district: "Private",
    projectType: "GUARDRAIL",
  },
  {
    id: "sunbound-b9r13",
    companyId: "sunbound",
    code: "B9R13",
    name: "Marsh Harbor Logistics Yard",
    status: "COMPLETED",
    owner: "Marsh Harbor Port Authority",
    district: "Private",
    projectType: "FENCE",
  },
];

