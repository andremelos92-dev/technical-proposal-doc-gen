import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import {
  A4_HEIGHT,
  A4_WIDTH,
  cell,
  FONT,
  imageRun,
  LOGO_URL,
  loadFirstImage,
  loadImage,
  logoParagraph,
  safeFileName,
  TEXT_SIZE,
  type LoadedImage,
} from "@/lib/docx/shared";
import { quotationSummarySection } from "@/lib/docx/quotation-summary";
import { formatDate, referenceNumber, type ProposalData, type Revision } from "@/lib/proposal";

const COVER_IMAGE_URLS = ["/proposal-cover.png", "/proposal-cover.jpg"];
const COVER_IMAGE_WIDTH_PX = 400;

const MARGIN = 1134; // 2cm
const REVISION_COLUMNS = [700, 1250, 1150, 1450, 1450, 1450, 1450];
const REVISION_HEADERS = ["Rev.", "Date", "Status", "Prepared By", "Checked By", "Approved By", "Remarks"];
const MIN_REVISION_ROWS = 5;

function rightLine(text: string, size: number, spacingBefore = 0): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: spacingBefore, after: 120 },
    children: [new TextRun({ text, font: FONT, size, bold: true })],
  });
}

/** The photo collage in the top-left corner, bleeding to the page edges. */
function coverImageParagraph(image: LoadedImage | null): Paragraph {
  if (!image) return new Paragraph({ spacing: { before: 4800 }, children: [] });
  return new Paragraph({
    indent: { left: -MARGIN },
    children: [imageRun(image, COVER_IMAGE_WIDTH_PX)],
  });
}

function revisionRow(revision: Revision): TableRow {
  const values = [
    revision.rev,
    formatDate(revision.date, "."),
    revision.status,
    revision.preparedBy,
    revision.checkedBy,
    revision.approvedBy,
    revision.remarks,
  ];
  return new TableRow({
    children: values.map((value, index) =>
      cell(value, REVISION_COLUMNS[index], { size: 16, align: AlignmentType.CENTER })
    ),
  });
}

function revisionTable(revisions: Revision[]): Table {
  const header = new TableRow({
    tableHeader: true,
    children: REVISION_HEADERS.map((label, index) =>
      cell(label, REVISION_COLUMNS[index], { bold: true, size: 16, align: AlignmentType.CENTER })
    ),
  });
  const emptyRows = Math.max(0, MIN_REVISION_ROWS - revisions.length);
  const blank: Revision = {
    rev: "",
    date: "",
    status: "",
    preparedBy: "",
    checkedBy: "",
    approvedBy: "",
    remarks: "",
  };

  return new Table({
    alignment: AlignmentType.CENTER,
    width: { size: REVISION_COLUMNS.reduce((sum, width) => sum + width, 0), type: WidthType.DXA },
    columnWidths: REVISION_COLUMNS,
    layout: TableLayoutType.FIXED,
    rows: [
      header,
      ...revisions.map(revisionRow),
      ...Array.from({ length: emptyRows }, () => revisionRow(blank)),
    ],
  });
}

function coverPage(data: ProposalData, logo: LoadedImage | null, coverImage: LoadedImage | null) {
  const projectLine = [data.quoteNumber, data.projectName].filter((part) => part.trim()).join(" ");
  const modelLine = [data.spec.towerType.trim() && `${data.spec.towerType.trim()} Model`, data.towerModel.trim()]
    .filter(Boolean)
    .join(" - ");

  return [
    coverImageParagraph(coverImage),
    logoParagraph(logo, 60, { before: 600, after: 240 }),
    rightLine("Cooling Tower Technical Proposal", 48),
    ...(projectLine ? [rightLine(projectLine.toUpperCase(), 24)] : []),
    ...(data.customerDetail.trim() ? [rightLine(data.customerDetail.trim().toUpperCase(), 24)] : []),
    rightLine("Cooling Tower Solutions", 24),
    ...(modelLine ? [rightLine(modelLine, 26, 480)] : []),
    rightLine(`Reference No. ${referenceNumber(data)}`, 26, 480),
    new Paragraph({ spacing: { before: 240 }, children: [] }),
    revisionTable(data.revisions),
  ];
}

export async function generateTechnicalProposal(data: ProposalData): Promise<Blob> {
  const [logo, coverImage] = await Promise.all([
    loadImage(LOGO_URL),
    loadFirstImage(COVER_IMAGE_URLS),
  ]);

  const document = new Document({
    creator: data.salesmanName || "Truwater",
    title: `Cooling Tower Technical Proposal ${data.quoteNumber}`,
    styles: { default: { document: { run: { font: FONT, size: TEXT_SIZE } } } },
    sections: [
      // Page 1: portrait cover, no header/footer.
      {
        properties: {
          page: {
            size: { width: A4_WIDTH, height: A4_HEIGHT },
            margin: { top: 0, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children: coverPage(data, logo, coverImage),
      },
      // Page 2: landscape quotation summary with its own header/footer.
      quotationSummarySection(data, logo),
    ],
  });

  return Packer.toBlob(document);
}

export function technicalProposalFileName(data: ProposalData): string {
  return safeFileName([data.quoteNumber, data.projectName], "Technical Proposal");
}
