import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

import { formatDate, SPEC_ROWS, type ProposalData } from "@/lib/proposal";

const FONT = "Arial";
const TEXT_SIZE = 18; // half-points -> 9pt
const LOGO_URL = "/truwater-logo.png";
const LOGO_HEIGHT_PX = 40;

// A4 landscape with 1000 twip (~1.76cm) margins.
const PAGE_WIDTH = 16838;
const PAGE_HEIGHT = 11906;
const MARGIN = 1000;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const DETAILS_COLUMNS = [2600, 4080, 4080, CONTENT_WIDTH - 2600 - 4080 * 2];
const SPEC_COLUMNS = [2800, 900, CONTENT_WIDTH - 2800 - 900];

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

type CellOptions = {
  bold?: boolean;
  columnSpan?: number;
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
};

/** Turns a (possibly multi-line) string into runs separated by line breaks. */
function runs(value: string, bold = false, size = TEXT_SIZE): TextRun[] {
  return value.split(/\r?\n/).map(
    (line, index) => new TextRun({ text: line, font: FONT, size, bold, break: index > 0 ? 1 : 0 })
  );
}

function cell(value: string, width: number, options: CellOptions = {}): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: options.columnSpan,
    borders: BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { left: 100, right: 100, top: 20, bottom: 20 },
    children: [new Paragraph({ alignment: options.align, children: runs(value, options.bold) })],
  });
}

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
  return new Paragraph({ spacing: { after: 200 }, children: runs(value, false, 20) });
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

/** Reads width/height from a PNG's IHDR chunk so the logo keeps its aspect ratio. */
function pngSize(buffer: ArrayBuffer): { width: number; height: number } {
  const view = new DataView(buffer);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

async function loadLogo(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(LOGO_URL);
    if (!response.ok || !response.headers.get("content-type")?.includes("image/png")) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

function logoParagraph(logo: ArrayBuffer | null): Paragraph {
  if (!logo) {
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "TRUWATER", font: FONT, size: 40, bold: true, color: "1E9AD6" }),
      ],
    });
  }

  const { width, height } = pngSize(logo);
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [
      new ImageRun({
        type: "png",
        data: logo,
        transformation: {
          width: Math.round((width / height) * LOGO_HEIGHT_PX),
          height: LOGO_HEIGHT_PX,
        },
      }),
    ],
  });
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

export async function generateProposalDocx(data: ProposalData): Promise<Blob> {
  const logo = await loadLogo();

  const document = new Document({
    creator: data.salesmanName || "Truwater",
    title: `Quotation Project Summary ${data.quoteNumber}`,
    styles: { default: { document: { run: { font: FONT, size: TEXT_SIZE } } } },
    sections: [
      {
        properties: {
          page: {
            // docx swaps width/height itself when the orientation is landscape.
            size: { width: PAGE_HEIGHT, height: PAGE_WIDTH, orientation: PageOrientation.LANDSCAPE },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 400, footer: 400 },
          },
        },
        headers: { default: new Header({ children: [logoParagraph(logo)] }) },
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
      },
    ],
  });

  return Packer.toBlob(document);
}

export function proposalFileName(data: ProposalData): string {
  const base = [data.quoteNumber, data.projectName, "Quotation Project Summary"]
    .filter((part) => part.trim())
    .join(" - ");
  return `${base.replace(/[\\/:*?"<>|]/g, "").trim()}.docx`;
}
