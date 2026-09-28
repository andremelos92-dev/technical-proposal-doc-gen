import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { generateCommercialDocument } from "@/lib/commercial-document";
import {
  formatDate,
  MAX_REVISIONS,
  projectTitle,
  proposalRecipient,
  referenceNumber,
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

/** Fills a Word template's {placeholders}; everything else in the file is kept as-is. */
export async function renderTemplate(templateUrl: string, values: TemplateValues): Promise<Blob> {
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
  if (kind === "commercial") return generateCommercialDocument(data);

  const { templateUrl, values, fileName } = DOCUMENTS[kind];
  return { blob: await renderTemplate(templateUrl, values(data)), fileName: fileName(data) };
}
