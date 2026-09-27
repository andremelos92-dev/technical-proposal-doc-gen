export const SPEC_ROWS = [
  { key: "customerRequires", label: "Customer Requires", unit: "#", example: "e.g. 8" },
  { key: "towerType", label: "Tower Type", unit: "", example: "e.g. FRP, SS309" },
  { key: "casingMaterial", label: "Casing Material", unit: "", example: "e.g. FRP, SS309" },
  { key: "fillMaterial", label: "Fill Material", unit: "", example: "e.g. PVC" },
  { key: "numberOfCells", label: "Number Of Cells", unit: "#", example: "e.g. 1" },
  { key: "kwCapacity", label: "kW Capacity", unit: "kW", example: "e.g. 1,680" },
  { key: "condenserFlowRate", label: "Condenser Flow Rate", unit: "L/s", example: "e.g. 73" },
  { key: "condInTemp", label: "Cond. In Temp", unit: "°C", example: "e.g. 35" },
  { key: "condOutTemp", label: "Cond. Out Temp", unit: "°C", example: "e.g. 29.5" },
  { key: "wetBulbTemp", label: "Wet Bulb Temp", unit: "°C", example: "e.g. 23" },
  { key: "noOfFans", label: "No Of Fans", unit: "#", example: "e.g. 1 per tower" },
  { key: "fanKw", label: "Fan kW", unit: "kW", example: "e.g. 11" },
  { key: "fanDriveType", label: "Fan Drive Type", unit: "", example: "e.g. Direct, Belt" },
  { key: "dimensions", label: "Dimensions", unit: "mm", example: "e.g. 3499 x 3499" },
  { key: "designOperatingWeight", label: "Design Operating Weight", unit: "kg", example: "e.g. 5,700" },
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
  recipient: Recipient;
  otherRecipient: string;
  revisions: Revision[];
};

/**
 * Companies a Technical Proposal can be addressed to instead of the end customer.
 * Add a region here (e.g. Victoria, Darwin) and it appears as an option on the form.
 */
export const PARTNERS = [
  { id: "sydney", region: "Sydney", name: "Complete Cooling Towers Service and Spares Pty Ltd" },
  { id: "queensland", region: "Queensland", name: "Cooling Tower Solutions" },
] as const;

/** "customer" copies Customer Detail, "other" uses the typed name, otherwise a partner id. */
export type Recipient = "customer" | "other" | (typeof PARTNERS)[number]["id"];

export const FLOW_TYPES = ["Counterflow", "Crossflow"] as const;
export type FlowType = (typeof FLOW_TYPES)[number];

/** The Technical Proposal revision table has this many rows. */
export const MAX_REVISIONS = 5;

/** Names offered in the revision table's sign-off columns. Add a name here to offer it. */
export const REVISION_PEOPLE = {
  preparedBy: ["Andre Santos", "Craig Alcorn"],
  checkedBy: ["Craig Alcorn", "Kenx Wong"],
  approvedBy: ["Kenx Wong", "WK How"],
} as const satisfies Partial<Record<keyof Revision, readonly string[]>>;

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

/** Today's date as yyyy-mm-dd in the user's local time zone (not UTC). */
function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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
    summaryIntro: "Please find my Summary",
    folderLink: "",
    spec: { ...emptySpec },
    flowType: "Counterflow",
    towerModel: "",
    recipient: "customer",
    otherRecipient: "",
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

/** The company name printed on the Technical Proposal cover. */
export function proposalRecipient(
  data: Pick<ProposalData, "recipient" | "otherRecipient" | "customerDetail">
): string {
  if (data.recipient === "customer") return data.customerDetail.trim();
  if (data.recipient === "other") return data.otherRecipient.trim();
  return PARTNERS.find((partner) => partner.id === data.recipient)?.name ?? "";
}

/** "TTA0146" dated 2026 -> "TTA/0146/2026". */
export function referenceNumber(data: Pick<ProposalData, "quoteNumber" | "date">): string {
  const year = /^\d{4}/.exec(data.date)?.[0] ?? String(new Date().getFullYear());
  const match = /^([A-Za-z]+)\s*(\d+)$/.exec(data.quoteNumber.trim());
  return match ? `${match[1].toUpperCase()}/${match[2]}/${year}` : data.quoteNumber;
}
