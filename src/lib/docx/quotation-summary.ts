import {
  AlignmentType,
  ExternalHyperlink,
  Footer,
  Header,
  PageOrientation,
  Paragraph,
  Table,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  type ISectionOptions,
} from "docx";

import {
  A4_HEIGHT,
  A4_WIDTH,
  cell,
  FONT,
  logoParagraph,
  runs,
  type LoadedImage,
} from "@/lib/docx/shared";
import { formatDate, SPEC_ROWS, type ProposalData } from "@/lib/proposal";

// A4 landscape with 1000 twip (~1.76cm) margins.
const PAGE_WIDTH = A4_HEIGHT;
const MARGIN = 1000;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const DETAILS_COLUMNS = [2600, 4080, 4080, CONTENT_WIDTH - 2600 - 4080 * 2];
const SPEC_COLUMNS = [2800, 900, CONTENT_WIDTH - 2800 - 900];

function table(columnWidths: number[], rows: TableRow[]): Table {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    rows,
  });
}

function spacer(): Paragraph {
  return new Paragraph({ children: [] });
}

function textParagraph(value: string): Paragraph {
  return new Paragraph({ spacing: { after: 200 }, children: runs(value, { size: 20 }) });
}

function detailsTable(data: ProposalData): Table {
  const [labelW, aW, bW, cW] = DETAILS_COLUMNS;
  const singleRow = (label: string, value: string) =>
    new TableRow({
      children: [cell(label, labelW, { bold: true }), cell(value, aW + bW + cW, { columnSpan: 3 })],
    });
  const tripleRow = (label: string, a: string, b: string, c: string) =>
    new TableRow({
      children: [cell(label, labelW, { bold: true }), cell(a, aW), cell(b, bW), cell(c, cW)],
    });

  return table(DETAILS_COLUMNS, [
    singleRow("Project Name", data.projectName),
    singleRow("Project Address", data.projectAddress),
    singleRow("TTA Quote Number", data.quoteNumber),
    singleRow("Date", formatDate(data.date)),
    singleRow("Date Quote Required", formatDate(data.dateQuoteRequired)),
    singleRow("Customer Detail", data.customerDetail),
    tripleRow("Contact Details", data.contactName, data.contactEmail, data.contactPhone),
    tripleRow("Salesman Details", data.salesmanName, data.salesmanEmail, data.salesmanPhone),
  ]);
}

function specTable(data: ProposalData): Table {
  const [labelW, unitW, valueW] = SPEC_COLUMNS;
  return table(
    SPEC_COLUMNS,
    SPEC_ROWS.map(
      (row) =>
        new TableRow({
          children: [
            cell(row.label, labelW),
            cell(row.unit, unitW, { align: AlignmentType.CENTER }),
            cell(data.spec[row.key], valueW),
          ],
        })
    )
  );
}

function folderLinkParagraph(link: string): Paragraph {
  const label = new TextRun({ text: "Link to folder", font: FONT, size: 20 });
  if (!link.trim()) return new Paragraph({ spacing: { after: 200 }, children: [label] });

  return new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({ text: "Link to folder: ", font: FONT, size: 20 }),
      new ExternalHyperlink({
        link: link.trim(),
        children: [new TextRun({ text: link.trim(), font: FONT, size: 20, style: "Hyperlink" })],
      }),
    ],
  });
}

function accessoriesParagraphs(accessories: string): Paragraph[] {
  const heading = new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: "Accessories", font: FONT, size: 20 })],
  });
  const items = accessories
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: line, font: FONT, size: 20 })],
        })
    );
  return [heading, ...items];
}

function footerParagraphs(data: ProposalData): Paragraph[] {
  const grey = { font: FONT, size: 16, color: "7F7F7F" };
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          ...grey,
          bold: true,
          text: "Truwater Technologies Australia Pty Ltd - Level 1, Tower 1, 201 Sussex Street Sydney, NSW, Australia, 2000 Ph +61 (02) 9556 9198",
        }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: CONTENT_WIDTH / 2 }],
      children: [
        new TextRun({ ...grey, text: "Quotation Project Summary" }),
        new TextRun({ ...grey, text: `\t${[data.quoteNumber, data.projectName].filter(Boolean).join(" ")}` }),
      ],
    }),
  ];
}

/** The Quotation Project Summary page, as an A4 landscape section of the proposal. */
export function quotationSummarySection(data: ProposalData, logo: LoadedImage | null): ISectionOptions {
  return {
    properties: {
      page: {
        // docx swaps width/height itself when the orientation is landscape.
        size: { width: A4_WIDTH, height: A4_HEIGHT, orientation: PageOrientation.LANDSCAPE },
        margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 400, footer: 400 },
      },
    },
    headers: { default: new Header({ children: [logoParagraph(logo, 40)] }) },
    footers: { default: new Footer({ children: footerParagraphs(data) }) },
    children: [
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({ text: `Quotation Project Summary ${data.quoteNumber}`, font: FONT, size: 32, bold: true }),
        ],
      }),
      detailsTable(data),
      spacer(),
      spacer(),
      textParagraph(data.greeting),
      textParagraph(data.summaryIntro),
      folderLinkParagraph(data.folderLink),
      specTable(data),
      ...accessoriesParagraphs(data.accessories),
    ],
  };
}
