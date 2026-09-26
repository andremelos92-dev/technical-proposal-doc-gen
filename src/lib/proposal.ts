export const SPEC_ROWS = [
  { key: "customerRequires", label: "Customer requires", unit: "#" },
  { key: "towerType", label: "Tower Type", unit: "" },
  { key: "casingMaterial", label: "Casing Material", unit: "" },
  { key: "fillMaterial", label: "Fill Material", unit: "" },
  { key: "numberOfCells", label: "Number of Cells", unit: "#" },
  { key: "kwCapacity", label: "kW Capacity", unit: "kW" },
  { key: "condenserFlowRate", label: "Condenser Flow Rate", unit: "L/s" },
  { key: "condInTemp", label: "Cond. In Temp", unit: "(°C)" },
  { key: "condOutTemp", label: "Cond. Out Temp", unit: "(°C)" },
  { key: "wetBulbTemp", label: "Wet Bulb Temp", unit: "(°C)" },
  { key: "noOfFans", label: "No of Fans", unit: "#" },
  { key: "fanKw", label: "Fan kW", unit: "kW" },
  { key: "fanDriveType", label: "Fan Drive Type", unit: "" },
  { key: "dimensions", label: "Dimensions", unit: "mm" },
  { key: "designOperatingWeight", label: "Design Operating Weight", unit: "kg" },
] as const;

export type SpecKey = (typeof SPEC_ROWS)[number]["key"];

export type Revision = {
  rev: string;
  date: string; // yyyy-mm-dd
  status: string;
  preparedBy: string;
  checkedBy: string;
  approvedBy: string;
  remarks: string;
};

export type ProposalData = {
  projectName: string;
  projectAddress: string;
  quoteNumber: string;
  date: string; // yyyy-mm-dd (from <input type="date">)
  dateQuoteRequired: string; // yyyy-mm-dd, or "ASAP"
  customerDetail: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  salesmanName: string;
  salesmanEmail: string;
  salesmanPhone: string;
  greeting: string;
  summaryIntro: string;
  folderLink: string;
  spec: Record<SpecKey, string>;
  flowType: FlowType;
  towerModel: string;
  revisions: Revision[];
};

export const FLOW_TYPES = ["Counterflow", "Crossflow"] as const;
export type FlowType = (typeof FLOW_TYPES)[number];

/** The Technical Proposal revision table has this many rows. */
export const MAX_REVISIONS = 5;

export function createRevision(rev: string): Revision {
  return {
    rev,
    date: today(),
    status: rev === "0" ? "Initial Bid" : "",
    preparedBy: "Andre Santos",
    checkedBy: "Craig Alcorn",
    approvedBy: "Kenx Wong",
    remarks: "",
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptySpec = Object.fromEntries(SPEC_ROWS.map((row) => [row.key, ""])) as Record<
  SpecKey,
  string
>;

export function createInitialProposal(): ProposalData {
  return {
    projectName: "",
    projectAddress: "",
    quoteNumber: "",
    date: today(),
    dateQuoteRequired: "",
    customerDetail: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    salesmanName: "Andre Santos",
    salesmanEmail: "andre.santos@truwater.net.au",
    salesmanPhone: "0420 559 560",
    greeting: "Dear Engineers,",
    summaryIntro: "Please find my Summary of the",
    folderLink: "",
    spec: { ...emptySpec },
    flowType: "Counterflow",
    towerModel: "",
    revisions: [createRevision("0")],
  };
}

/** "2026-09-26" -> "26/09/2026" (Australian format), or "26.09.2026" with separator ".". */
export function formatDate(value: string, separator = "/"): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? [match[3], match[2], match[1]].join(separator) : value;
}

/** "TTA0149" + "275 Kent St" -> "TTA0149 275 Kent St" (unless the name already starts with the quote number). */
export function projectTitle(data: Pick<ProposalData, "quoteNumber" | "projectName">): string {
  const quote = data.quoteNumber.trim();
  const name = data.projectName.trim();
  if (!quote || name.toUpperCase().startsWith(quote.toUpperCase())) return name;
  return [quote, name].filter(Boolean).join(" ");
}

/** "TTA0146" dated 2026 -> "TTA/0146/2026". */
export function referenceNumber(data: Pick<ProposalData, "quoteNumber" | "date">): string {
  const year = /^\d{4}/.exec(data.date)?.[0] ?? String(new Date().getFullYear());
  const match = /^([A-Za-z]+)\s*(\d+)$/.exec(data.quoteNumber.trim());
  return match ? `${match[1].toUpperCase()}/${match[2]}/${year}` : data.quoteNumber;
}
