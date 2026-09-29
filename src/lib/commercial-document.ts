import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  PageBreak,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableLayoutType,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import PizZip from "pizzip";

import {
  formatDate,
  projectTitle,
  referenceNumber,
  resolvedCommercialTowers,
  type ProposalData,
} from "@/lib/proposal";

const BLUE = "1F78A8";
const PALE_BLUE = "C6D9F1";
const LIGHT_BLUE = "DCEEF6";
const BLACK = "111111";
const WHITE = "FFFFFF";
const PAGE_WIDTH = 10200;
const CURRENCY = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});
const NUMBER = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 });

type ParagraphOptions = {
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  before?: number;
  after?: number;
  bold?: boolean;
  color?: string;
  italic?: boolean;
  size?: number;
  underline?: boolean;
};

function para(text: string, options: ParagraphOptions = {}) {
  return new Paragraph({
    alignment: options.alignment,
    spacing: { before: options.before ?? 0, after: options.after ?? 100 },
    keepNext: false,
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: options.size ?? 21,
        bold: options.bold,
        color: options.color ?? BLACK,
        italics: options.italic,
        underline: options.underline ? { type: "single" } : undefined,
      }),
    ],
  });
}

type TableOptions = {
  columnWidths?: number[];
  fontSize?: number;
  headerRows?: number;
  fillRows?: number[];
  highlightCells?: string[];
  boldRows?: number[];
  centerColumns?: number[];
  noBorders?: boolean;
};

function table(rows: string[][], options: TableOptions = {}): Table {
  const columnCount = Math.max(...rows.map((row) => row.length));
  const widths = options.columnWidths ?? Array(columnCount).fill(Math.floor(PAGE_WIDTH / columnCount));
  const border = options.noBorders
    ? { style: BorderStyle.NONE, size: 0, color: WHITE }
    : { style: BorderStyle.SINGLE, size: 6, color: BLACK };

  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      (values, rowIndex) =>
        new TableRow({
          tableHeader: rowIndex < (options.headerRows ?? 0),
          cantSplit: true,
          children: Array.from({ length: columnCount }, (_, columnIndex) => {
            const value = values[columnIndex] ?? "";
            const highlighted =
              options.fillRows?.includes(rowIndex) ||
              options.highlightCells?.includes(`${rowIndex}:${columnIndex}`);
            const isBold =
              rowIndex < (options.headerRows ?? 0) || options.boldRows?.includes(rowIndex);
            const alignment = options.centerColumns?.includes(columnIndex)
              ? AlignmentType.CENTER
              : undefined;
            const paragraphs = value.split(/\r?\n/).map((line) =>
              new Paragraph({
                alignment,
                spacing: { before: 0, after: 30 },
                children: [
                  new TextRun({
                    text: line,
                    font: "Arial",
                    size: options.fontSize ?? 20,
                    bold: isBold,
                    color: BLACK,
                  }),
                ],
              })
            );
            return new TableCell({
              width: { size: widths[columnIndex], type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              shading: highlighted
                ? { type: ShadingType.CLEAR, fill: PALE_BLUE, color: PALE_BLUE }
                : undefined,
              margins: { top: 65, bottom: 65, left: 100, right: 100 },
              borders: {
                top: border,
                bottom: border,
                left: border,
                right: border,
              },
              children: paragraphs,
            });
          }),
        })
    ),
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    },
  });
}

function sectionBand(text: string) {
  return table([[text]], {
    columnWidths: [PAGE_WIDTH],
    fillRows: [0],
    boldRows: [0],
    centerColumns: [0],
    fontSize: 24,
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function money(value: string) {
  const amount = Number(value);
  if (!value.trim() || !Number.isFinite(amount)) return value;
  return `AUD $ ${CURRENCY.format(amount).replace(/^\$/, "")}`;
}

function rate(value: string) {
  const amount = Number(value);
  if (!value.trim() || !Number.isFinite(amount)) return value;
  return `AUD ${NUMBER.format(amount)}`;
}

type CoverPhoto = { data: Uint8Array; type: "jpg" | "png" };
type CoverMedia = { logo: Uint8Array; photos: CoverPhoto[] };

async function loadCoverMedia(): Promise<CoverMedia> {
  const [templateResponse, logoResponse] = await Promise.all([
    fetch("/templates/technical-proposal.docx"),
    fetch("/truwater-logo.png"),
  ]);
  if (!templateResponse.ok) throw new Error("Could not load the proposal cover photos.");
  if (!logoResponse.ok) throw new Error("Could not load the Truwater logo.");

  const zip = new PizZip(await templateResponse.arrayBuffer());
  const photoPaths = ["image1.jpg", "image2.png", "image4.jpeg", "image6.png"] as const;
  const photos = photoPaths.map((name) => {
    const image = zip.file(`word/media/${name}`);
    if (!image) throw new Error(`Cover photo is missing: ${name}`);
    return {
      data: new Uint8Array(image.asUint8Array()),
      type: name.endsWith(".jpg") || name.endsWith(".jpeg") ? "jpg" as const : "png" as const,
    };
  });

  return { logo: new Uint8Array(await logoResponse.arrayBuffer()), photos };
}

function imageGrid(photos: CoverPhoto[]) {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
  const imageCell = (photo: CoverPhoto) =>
    new TableCell({
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 35, bottom: 35, left: 35, right: 35 },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              type: photo.type,
              data: photo.data,
              transformation: { width: 132, height: 126 },
            }),
          ],
        }),
      ],
    });
  const rows = [
    new TableRow({ children: [imageCell(photos[0]), imageCell(photos[1])] }),
    new TableRow({ children: [imageCell(photos[2]), imageCell(photos[3])] }),
  ];
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [2100, 2100],
    rows,
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
    },
  });
}

function coverPage(data: ProposalData, media: CoverMedia): (Paragraph | Table)[] {
  const title = projectTitle(data) || "Cooling Tower Proposal";
  const towers = resolvedCommercialTowers(data);
  const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
  const coverDetails = [
    para("Cooling Tower Proposal", { alignment: AlignmentType.RIGHT, size: 30, bold: true, after: 120 }),
    para(title, { alignment: AlignmentType.RIGHT, size: 22, bold: true, after: 110 }),
    para(data.customerDetail || "Client", { alignment: AlignmentType.RIGHT, size: 19, bold: true, after: 30 }),
    para("Cooling Towers Solutions", { alignment: AlignmentType.RIGHT, size: 18, bold: true, after: 100 }),
    ...towers.map((tower) =>
      para(`${data.flowType} Model - ${tower.model}`, { alignment: AlignmentType.RIGHT, size: 20, bold: true, after: 70 })
    ),
    para(`Reference No. ${referenceNumber(data)}`, { alignment: AlignmentType.RIGHT, size: 19, bold: true, after: 0 }),
  ];
  const coverTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: [4300, PAGE_WIDTH - 4300],
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 4300, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 50, bottom: 50, left: 0, right: 100 },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [imageGrid(media.photos)],
          }),
          new TableCell({
            width: { size: PAGE_WIDTH - 4300, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 120, bottom: 120, left: 100, right: 0 },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 1250 },
                children: [new ImageRun({ type: "png", data: media.logo, transformation: { width: 230, height: 51 } })],
              }),
              ...coverDetails,
            ],
          }),
        ],
      }),
    ],
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
    },
  });

  const revisions = Array.from({ length: 5 }, (_, index) => {
    const revision = data.revisions[index];
    return revision
      ? [
          revision.rev,
          formatDate(revision.date, "."),
          revision.status,
          revision.preparedBy,
          revision.checkedBy,
          revision.approvedBy,
          revision.remarks,
        ]
      : ["", "", "", "", "", "", ""];
  });

  return [
    coverTable,
    para("", { after: 500 }),
    table(
      [["Rev.", "Date", "Status", "Prepared By", "Checked By", "Approved By", "Remarks"], ...revisions],
      {
        columnWidths: [650, 1300, 1400, 1800, 1800, 1800, 1450],
        headerRows: 1,
        centerColumns: [0, 1, 2, 3, 4, 5],
        fontSize: 17,
      }
    ),
    pageBreak(),
  ];
}

function coverLetterPage(data: ProposalData): (Paragraph | Table)[] {
  const title = projectTitle(data);
  const contact = data.contactName || "";
  return [
    para("PROPOSAL COVER LETTER", { alignment: AlignmentType.CENTER, size: 26, bold: true, underline: true, after: 280 }),
    table(
      [
        ["Project Name", ":", title],
        ["Client", ":", data.customerDetail],
        ["Bidder", ":", "Truwater Technologies (Australia) Pty Ltd"],
        ["", "", ""],
        ["ATTN.", ":", contact],
        ["SUBJECT", ":", title],
      ],
      { columnWidths: [1700, 300, PAGE_WIDTH - 2000], noBorders: true, fontSize: 22, boldRows: [0, 1, 2, 4, 5] }
    ),
    table([[""]], { columnWidths: [PAGE_WIDTH], noBorders: true }),
    para("We thank you for your enquiry and are pleased to forward herewith our proposal for your kind consideration.", { size: 21, after: 210 }),
    para("Truwater is delighted to receive your invitation to bid. This document presents the commercial proposal in response your inquiry.", { size: 21, after: 430 }),
    para("Our cooling towers are designed in accordance with the international codes and standards. With our quality engineering, services and products, we will provide the most attainable and economic solution to meet your needs. We appreciate your time and effort in reviewing and evaluating this proposal. Please do not hesitate to contact us should you have any further queries.", { size: 21, after: 430 }),
    para("Please allow us to reiterate our interest in becoming your cooling tower solution partner. Thank you for your kind attention and we look forward to our successful collaboration.", { size: 21, after: 400 }),
    para("Yours faithfully,", { size: 21, after: 130 }),
    para("for TRUWATER TECHNOLOGIES AUSTRALIA PTY LTD", { size: 21, bold: true, after: 430 }),
    table(
      [
        ["Craig Alcorn", "Kenx Wong"],
        ["Sales & Project Manager", "Sales Director"],
        ["+(61)0476 202 471", "(6)012-236 7782"],
      ],
      { columnWidths: [PAGE_WIDTH / 2, PAGE_WIDTH / 2], noBorders: true, fontSize: 21 }
    ),
    pageBreak(),
  ];
}

function pricingPage(data: ProposalData, tower: ReturnType<typeof resolvedCommercialTowers>[number]) {
  const coolingDescription = `Cooling Tower Truwater Mechanical Induced Draft, ${data.flowType}, CTI Model, Vertical Air Discharged, SS316 Construction Cooling Tower with SS316 Nuts and Bolts Wetted and Non-Wetted, SS316 Cold Water Basin Supporting Framework, SS316 Basin Piping Water outlet, SS316 Flange Material (inlet, Outlet & Balancing), SS316 Float Valve c/w Ball and SS316 Mechanical Support components.`;
  const itemAmount = money(tower.price);
  const properties = [
    ["Equipment no", tower.equipment],
    ["Cooling Tower Model", tower.model],
    ["No. of cooling tower cells", tower.cells],
    ["Type", `Mechanical induced draft ${data.flowType}`],
    ["Cooling tower arrangement", "In-Line"],
    ["Design Flowrate", tower.flowRate],
    ["Hot (Inlet) Water Temperature", tower.hotTemperature],
    ["Cold (Outlet) Water Temperature", tower.coldTemperature],
    ["Wet Bulb Temperature", tower.wetBulb],
    ["Material of Construction", tower.material],
    ["Type of Drive", tower.driveType],
    ["Motor kW", tower.motor],
    ["Type of infill", tower.infill],
    ["Mechanical Support Base", tower.material],
    ["Cold Water Basin", tower.material],
  ];
  return [
    sectionBand("PRICING SCHEDULE -"),
    para("", { after: 140 }),
    table([["1.0", coolingDescription]], { columnWidths: [650, PAGE_WIDTH - 650], fontSize: 21 }),
    table(properties, { columnWidths: [4300, PAGE_WIDTH - 4300], fontSize: 21 }),
    table(
      [
        ["1.1", "Price for Cooling Tower Material", itemAmount],
        ["", "Quantity", "1 of"],
        ["1.2", "Price for Cooling Tower Material C&F Brisbane Port in containerized,", itemAmount],
        ["1.3", "Total Lump Sum for Cooling Towers Material C&F Brisbane Port", itemAmount],
      ],
      {
        columnWidths: [650, 5100, PAGE_WIDTH - 5750],
        fillRows: [3],
        boldRows: [0, 2, 3],
        fontSize: 21,
      }
    ),
    pageBreak(),
  ];
}

function scopePage(data: ProposalData): (Paragraph | Table)[] {
  const rows = data.commercial.scope.map((item) => [
    item.description,
    item.responsibility === "Truwater" ? "O" : "",
    item.responsibility === "Optional" ? "O" : "",
    item.responsibility === "Purchaser" ? "O" : "",
  ]);
  return [
    sectionBand("SCOPE OF SUPPLY"),
    para("", { after: 170 }),
    table(
      [["DESCRIPTIONS", "Truwater", "Optional", "By Purchaser"], ...rows],
      {
        columnWidths: [6500, 1250, 1250, PAGE_WIDTH - 9000],
        headerRows: 1,
        centerColumns: [1, 2, 3],
        fontSize: 18,
      }
    ),
    pageBreak(),
  ];
}

function optionalServicesPage(data: ProposalData): (Paragraph | Table)[] {
  const c = data.commercial;
  const serviceText = (description: string) =>
    `${description}\nTruwater TFA for cooling tower erection.\nDuration: This rate covers 8-manhours per normal working day from 8.00am to 5.00pm (excluding one-hour for lunch), 6 days a week. ${c.travelTerms}`;
  return [
    table(
      [["A", "Optional Item – SPARE PART LIST / Additional Items"]],
      { columnWidths: [650, PAGE_WIDTH - 650], fillRows: [0], boldRows: [0], fontSize: 22 }
    ),
    table(
      [
        ["A.1", `Construction & Commissioning Spares\n${c.constructionSpares}`, "Included in Base Proposal"],
        ["A.2", `Recommended Special Tools for Erection & Commissioning\n${c.specialTools}`, "Included in Base Proposal"],
        ["A.3", `Recommended Spare Parts for 2 years operation (Optional)\n${c.recommendedSpares}`, "Optional"],
      ],
      { columnWidths: [700, 6400, PAGE_WIDTH - 7100], fontSize: 20 }
    ),
    table(
      [["B", "Optional Item - SUPERVISION SERVICES"]],
      { columnWidths: [650, PAGE_WIDTH - 650], fillRows: [0], boldRows: [0], fontSize: 22 }
    ),
    table(
      [
        ["B.1", serviceText("Supervisor for Erection & Installation\nSupervisor for Cooling tower erection"), `${rate(c.erectionRate)} /man day`],
        ["B.2", serviceText("Supervisor for Pre-commissioning or Commissioning\nSupervisor for Cooling tower Pre-Commissioning or Commissioning"), `${rate(c.commissioningRate)} /man day`],
      ],
      { columnWidths: [700, 6400, PAGE_WIDTH - 7100], fontSize: 19 }
    ),
    table(
      [["B.3", `Overtime rates on workday\n(Monday to Saturday): ${rate(c.overtimeWeekdayRate)} /hour,\nOvertime rates on weekend (Sunday): ${rate(c.overtimeSundayRate)} /hour.\nOvertime rates on public holidays: ${rate(c.overtimeHolidayRate)} /hour.\nExcluding transportation, air ticket, accommodation at site.`]],
      { columnWidths: [700, PAGE_WIDTH - 700], boldRows: [0], fontSize: 19 }
    ),
    pageBreak(),
  ];
}

function purchaserAndDeliveryPage(data: ProposalData): (Paragraph | Table)[] {
  const c = data.commercial;
  const schedule = c.schedule;
  const durations = schedule.map((step) => step.duration);
  const ganttRows = schedule.map((step, rowIndex) => {
    const cells = Array(schedule.length).fill("");
    if (rowIndex === 3 && cells.length > 3) {
      cells[2] = " ";
      cells[3] = " ";
    } else if (rowIndex < cells.length) {
      cells[rowIndex] = " ";
    }
    return [step.description, ...cells];
  });
  const highlighted = schedule.flatMap((_, rowIndex) => {
    const positions = rowIndex === 3 ? [rowIndex + 1, rowIndex + 2] : [rowIndex + 1];
    return positions.map((columnIndex) => `${rowIndex + 1}:${columnIndex}`);
  });

  return [
    para("PURCHASER’S RESPONSIBILITIES (in the event that Truwater or Truwater supervisory services are being engaged for the cooling tower erection)", { bold: true, underline: true, size: 21, after: 170 }),
    ...c.purchaserResponsibilities
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => para(`•   ${item}`, { size: 20, after: 55 })),
    para("", { after: 160 }),
    sectionBand("DELIVERY SCHEDULE"),
    para(`${c.deliveryNotes} Delivery Time - ${c.deliveryTime}`, { size: 20, before: 150, after: 140 }),
    table(
      [["Description", ...durations], ...ganttRows],
      {
        columnWidths: [4200, ...Array(schedule.length).fill(Math.floor((PAGE_WIDTH - 4200) / schedule.length))],
        headerRows: 1,
        fillRows: [0],
        highlightCells: highlighted,
        centerColumns: Array.from({ length: schedule.length }, (_, index) => index + 1),
        fontSize: 18,
      }
    ),
    pageBreak(),
  ];
}

function termsPage(data: ProposalData): (Paragraph | Table)[] {
  const c = data.commercial;
  const exclusionClauses = c.exclusions.split(/\r?\n/).filter(Boolean);
  const gstClause = exclusionClauses.find((clause) => clause.trim().startsWith("(b)"));
  const remainingExclusions = exclusionClauses.filter((clause) => clause !== gstClause);
  return [
    sectionBand("TERMS OF CONDITION"),
    para("", { after: 90 }),
    para("1.   PRICE BASIS", { bold: true, underline: true, size: 22, after: 60 }),
    para(c.priceBasis, { size: 21, after: 60 }),
    para(`(a)  ${c.priceInclusions}`, { size: 21, after: 45 }),
    para(gstClause ?? "(b) Price is exclusive of GST.", { size: 21, after: 45 }),
    para(`(c)  ${c.liability}`, { size: 21, after: 45 }),
    ...remainingExclusions.map((item) => para(item, { size: 21, after: 45 })),
    para("", { after: 110 }),
    para("2.   CURRENCY OF TENDER BID", { bold: true, underline: true, size: 22, after: 60 }),
    para("Prices quoted are in Australia Dollar (AUD).", { size: 21, after: 180 }),
    para("3.   PROPOSAL VALIDITY", { bold: true, underline: true, size: 22, after: 60 }),
    para(`Validity of this proposal shall be ${c.validity}`, { size: 21, after: 180 }),
    para("4.   TERMS OF PAYMENT", { bold: true, underline: true, size: 22, after: 60 }),
    para("Payment Milestones: -", { size: 21, after: 40 }),
    para(`-    ${c.paymentAdvance}`, { size: 21, after: 40 }),
    para(`-    ${c.paymentBalance}`, { size: 21, after: 180 }),
    para("5.   WARRANTY PERIOD", { bold: true, underline: true, size: 22, after: 60 }),
    para(c.warranty, { size: 21, after: 0 }),
  ];
}

function documentTitle(title: string) {
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").trim() || "Proposal";
  return `Commercial Proposal ${safeTitle}.docx`;
}

function price(value: string): string {
  const amount = Number(value);
  return value.trim() && Number.isFinite(amount) ? CURRENCY.format(amount) : value;
}

export async function generateCommercialDocument(data: ProposalData) {
  const title = projectTitle(data) || "Proposal";
  const towers = resolvedCommercialTowers(data);
  const media = await loadCoverMedia();
  const children: (Paragraph | Table)[] = [
    ...coverPage(data, media),
    ...coverLetterPage(data),
    sectionBand("COMMERCIAL PROPOSAL"),
    pageBreak(),
    ...pricingPage(data, towers[0]),
    ...pricingPage(data, towers[1] ?? towers[0]),
    ...scopePage(data),
    ...optionalServicesPage(data),
    ...purchaserAndDeliveryPage(data),
    ...termsPage(data),
  ];

  const document = new Document({
    creator: "Truwater Technologies Australia Pty Ltd",
    title: `Commercial Proposal ${title}`,
    description: "Commercial Proposal matching the supplied PDF layout.",
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 21 },
          paragraph: { spacing: { after: 100 } },
        },
        heading1: {
          run: { font: "Arial", size: 24, bold: true, color: BLUE },
          paragraph: { spacing: { before: 240, after: 120 }, keepNext: true },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 850, right: 850, bottom: 850, left: 850 },
          },
        },
        children,
      },
    ],
  });

  return { blob: await Packer.toBlob(document), fileName: documentTitle(title) };
}
