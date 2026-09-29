import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import {
  formatDate,
  MAX_REVISIONS,
  projectTitle,
  proposalRecipient,
  referenceNumber,
  resolvedCommercialTowers,
  SPEC_ROWS,
  type ProposalData,
  type Revision,
} from "@/lib/proposal";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type TemplateValues = Record<string, string>;

type DocumentTemplate = {
  label: string;
  /** Word file in /public/templates with {placeholders}. */
  templateUrl: string;
  fileName: (data: ProposalData) => string;
  values: (data: ProposalData) => TemplateValues;
};

function rfqValues(data: ProposalData): TemplateValues {
  const title = projectTitle(data);
  return {
    documentTitle: [title, data.customerDetail.trim()].filter(Boolean).join(" "),
    projectTitle: title,
    projectAddress: data.projectAddress,
    quoteNumber: data.quoteNumber,
    date: formatDate(data.date),
    dateQuoteRequired: formatDate(data.dateQuoteRequired),
    customerDetail: data.customerDetail,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    salesmanName: data.salesmanName,
    salesmanEmail: data.salesmanEmail,
    salesmanPhone: data.salesmanPhone,
    greeting: data.greeting,
    summaryIntro: data.summaryIntro,
    folderLink: data.folderLink.trim(),
    ...Object.fromEntries(SPEC_ROWS.map((row) => [`spec_${row.key}`, data.spec[row.key]])),
  };
}

function revisionValues(revisions: Revision[]): TemplateValues {
  const values: TemplateValues = {};
  for (let row = 1; row <= MAX_REVISIONS; row++) {
    const revision = revisions[row - 1];
    for (const key of Object.keys(revision ?? {}) as (keyof Revision)[]) {
      values[`r${row}_${key}`] = key === "date" ? formatDate(revision[key], ".") : revision[key];
    }
  }
  return values;
}

function technicalProposalValues(data: ProposalData): TemplateValues {
  return {
    projectTitle: projectTitle(data),
    // The cover is addressed to the chosen recipient (customer, regional partner or other).
    customerDetail: proposalRecipient(data),
    modelLine: [`${data.flowType} Model`, data.towerModel.trim()].filter(Boolean).join(" - "),
    referenceNumber: referenceNumber(data),
    ...revisionValues(data.revisions),
  };
}

function fileName(prefix: string, data: ProposalData): string {
  return `${[prefix, projectTitle(data)].join(" ").replace(/[\\/:*?"<>|]/g, "").trim()}.docx`;
}

export const DOCUMENTS = {
  rfq: {
    label: "RFQ",
    templateUrl: "/templates/rfq.docx",
    fileName: (data) => fileName("RFQ", data),
    values: rfqValues,
  },
  proposal: {
    label: "Technical Proposal",
    templateUrl: "/templates/technical-proposal.docx",
    fileName: (data) => fileName("Technical Proposal", data),
    values: technicalProposalValues,
  },
} satisfies Record<string, DocumentTemplate>;

export type DocumentKind = keyof typeof DOCUMENTS | "commercial";

const AUD = new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NUMBER = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 });

/** "389449" -> "AUD $ 389,449.00"; anything that isn't a plain number is kept as typed. */
function audPrice(value: string): string {
  const amount = Number(value.replace(/[,\s]/g, ""));
  return value.trim() && Number.isFinite(amount) ? `AUD $ ${AUD.format(amount)}` : value;
}

/** "1600" -> "1,600"; anything that isn't a plain number is kept as typed. */
function rate(value: string): string {
  const amount = Number(value.replace(/[,\s]/g, ""));
  return value.trim() && Number.isFinite(amount) ? NUMBER.format(amount) : value;
}

/** Splits a multi-line field into list items, dropping manual "a)" / "(b)" prefixes (Word numbers them). */
function listItems(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\(?[a-z]\)\s*/i, "").trim())
    .filter(Boolean);
}

function commercialValues(data: ProposalData): Record<string, unknown> {
  const c = data.commercial;
  const customer = data.customerDetail.trim();
  const partner = data.recipient === "customer" ? "" : proposalRecipient(data);
  const towers = resolvedCommercialTowers(data);
  const exclusions = listItems(c.exclusions);

  const towerValues = Object.fromEntries(
    towers.slice(0, 2).flatMap((tower, index) =>
      Object.entries({ ...tower, price: audPrice(tower.price) }).map(([key, value]) => [
        `t${index + 1}_${key}`,
        value,
      ])
    )
  );
  const scheduleValues = Object.fromEntries(
    c.schedule.flatMap((step, index) => [
      [`s${index + 1}_description`, step.description],
      [`s${index + 1}_duration`, step.duration],
    ])
  );

  return {
    // Cover
    projectTitle: projectTitle(data),
    coverParties: [customer, partner].filter(Boolean),
    // Same model line and reference as the Technical Proposal cover.
    coverTowerLines: [[`${data.flowType} Model`, data.towerModel.trim()].filter(Boolean).join(" - ")],
    commercialReference: referenceNumber(data),
    ...revisionValues(c.revisions),
    // Cover letter
    clientLine: [partner, customer].filter(Boolean).join(" – "),
    attention: data.contactName,
    // Pricing schedule (one page per tower)
    flowType: data.flowType,
    ...towerValues,
    // Scope of supply
    scope: c.scope.map((item) => ({
      description: item.description,
      truwater: item.responsibility === "Truwater",
      optional: item.responsibility === "Optional",
      purchaser: item.responsibility === "Purchaser",
    })),
    // Optional items
    constructionSpares: listItems(c.constructionSpares),
    specialTools: listItems(c.specialTools),
    recommendedSpares: listItems(c.recommendedSpares),
    travelTerms: c.travelTerms,
    erectionRate: rate(c.erectionRate),
    commissioningRate: rate(c.commissioningRate),
    overtimeWeekdayRate: rate(c.overtimeWeekdayRate),
    overtimeSundayRate: rate(c.overtimeSundayRate),
    overtimeHolidayRate: rate(c.overtimeHolidayRate),
    // Purchaser responsibilities and delivery
    responsibilities: listItems(c.purchaserResponsibilities),
    deliveryNotes: c.deliveryNotes,
    ...scheduleValues,
    deliveryTime: c.deliveryTime,
    // Terms of condition: (a) inclusions, (b) first exclusion, (c) liability, (d)+ remaining exclusions
    priceBasis: c.priceBasis,
    priceClauses: [c.priceInclusions.trim(), exclusions[0], c.liability.trim(), ...exclusions.slice(1)].filter(Boolean),
    validity: c.validity,
    paymentAdvance: c.paymentAdvance,
    paymentBalance: c.paymentBalance,
    warranty: c.warranty,
  };
}

const COMMERCIAL_TEMPLATE_URL = "/templates/commercial-proposal.docx";
const commercialFileName = (data: ProposalData) => fileName("Commercial Proposal", data);

/** Fills a Word template's {placeholders}; everything else in the file is kept as-is. */
export async function renderTemplate(
  templateUrl: string,
  values: Record<string, unknown>
): Promise<Blob> {
  const response = await fetch(templateUrl);
  if (!response.ok) throw new Error(`Template not found: ${templateUrl}`);

  const doc = new Docxtemplater(new PizZip(await response.arrayBuffer()), {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });
  doc.render(values);
  return doc.getZip().generate({ type: "blob", mimeType: DOCX_MIME, compression: "DEFLATE" });
}

export async function generateDocument(kind: DocumentKind, data: ProposalData) {
  if (kind === "commercial") {
    return {
      blob: await renderTemplate(COMMERCIAL_TEMPLATE_URL, commercialValues(data)),
      fileName: commercialFileName(data),
    };
  }

  const { templateUrl, values, fileName } = DOCUMENTS[kind];
  return { blob: await renderTemplate(templateUrl, values(data)), fileName: fileName(data) };
}
