import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import {
  formatDate,
  projectTitle,
  proposalRecipient,
  referenceNumber,
  resolvedCommercialTowers,
  type ProposalData,
} from "@/lib/proposal";

const BLUE = "1F78A8";
const PALE_BLUE = "DCEEF6";
const GREY = "D9E1E5";
const CURRENCY = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

function paragraph(text: string, options: { bold?: boolean; size?: number; color?: string } = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: options.size ?? 20,
        bold: options.bold,
        color: options.color,
      }),
    ],
  });
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 260, after: 120 },
    keepNext: true,
  });
}

function table(headers: string[], rows: string[][]): Table {
  const allRows = [headers, ...rows];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: allRows.map(
      (values, rowIndex) =>
        new TableRow({
          tableHeader: rowIndex === 0,
          children: values.map(
            (value) =>
              new TableCell({
                shading:
                  rowIndex === 0
                    ? { type: ShadingType.CLEAR, fill: PALE_BLUE, color: PALE_BLUE }
                    : undefined,
                margins: { top: 90, bottom: 90, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    spacing: { after: 0 },
                    children: [
                      new TextRun({
                        text: value,
                        font: "Arial",
                        size: 18,
                        bold: rowIndex === 0,
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
    ),
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      left: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      right: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: GREY },
    },
  });
}

function listParagraphs(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        new Paragraph({
          bullet: { level: 0 },
          indent: { left: 360, hanging: 180 },
          spacing: { after: 80 },
          children: [new TextRun({ text: line, font: "Arial", size: 20 })],
        })
    );
}

function price(value: string): string {
  const amount = Number(value);
  return value.trim() && Number.isFinite(amount) ? CURRENCY.format(amount) : value;
}

export async function generateCommercialDocument(data: ProposalData) {
  const title = projectTitle(data);
  const recipient = proposalRecipient(data) || data.customerDetail.trim();
  const towers = resolvedCommercialTowers(data);
  const total = towers.reduce((sum, tower) => sum + (Number(tower.price) || 0), 0);
  const commercial = data.commercial;
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "TRUWATER TECHNOLOGIES AUSTRALIA PTY LTD", font: "Arial", bold: true, size: 24, color: BLUE }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "COMMERCIAL PROPOSAL", font: "Arial", bold: true, size: 32 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [new TextRun({ text: title, font: "Arial", bold: true, size: 24 })],
    }),
    table(["Proposal details", ""], [
      ["Project", title],
      ["Client", recipient],
      ["Attention", data.contactName],
      ["Project address", data.projectAddress],
      ["TTA quote number", data.quoteNumber],
      ["Reference number", referenceNumber(data)],
      ["Proposal date", formatDate(data.date)],
      ["Subject", title],
    ]),
    heading("1. Pricing Schedule", HeadingLevel.HEADING_1),
    paragraph(`Mechanical induced-draft ${data.flowType.toLowerCase()} cooling towers, vertical air discharge, SS316 construction.`, { color: "4B5563" }),
    table(
      ["Equipment", "Model", "Cells", "Design flow rate", "Motor", "Material price"],
      towers.map((tower) => [
        tower.equipment,
        tower.model,
        tower.cells,
        tower.flowRate,
        tower.motor,
        price(tower.price),
      ])
    ),
    paragraph(`Total lump sum for cooling tower materials: ${CURRENCY.format(total)} (C&F Brisbane Port, GST excluded).`, { bold: true, size: 22 }),
    table(
      ["Equipment", "Hot water", "Cold water", "Wet bulb", "Material", "Drive", "Infill"],
      towers.map((tower) => [
        tower.equipment,
        tower.hotTemperature,
        tower.coldTemperature,
        tower.wetBulb,
        tower.material,
        tower.driveType,
        tower.infill,
      ])
    ),
    heading("2. Scope of Supply", HeadingLevel.HEADING_1),
    table(
      ["Description", "Responsibility"],
      commercial.scope.map((item) => [item.description, item.responsibility])
    ),
    heading("3. Optional Items and Services", HeadingLevel.HEADING_1),
    table(
      ["Item", "Details / rate"],
      [
        ["Construction and commissioning spares", commercial.constructionSpares],
        ["Special tools included", commercial.specialTools],
        ["Recommended two-year spares (optional)", commercial.recommendedSpares],
        ["Erection supervision", `${price(commercial.erectionRate)} per man-day`],
        ["Commissioning supervision", `${price(commercial.commissioningRate)} per man-day`],
        ["Overtime Monday-Saturday", `${price(commercial.overtimeWeekdayRate)} per hour`],
        ["Overtime Sunday", `${price(commercial.overtimeSundayRate)} per hour`],
        ["Overtime public holidays", `${price(commercial.overtimeHolidayRate)} per hour`],
        ["Travel and accommodation", commercial.travelTerms],
      ]
    ),
    heading("4. Purchaser Responsibilities", HeadingLevel.HEADING_1),
    ...listParagraphs(commercial.purchaserResponsibilities),
    heading("5. Delivery Schedule", HeadingLevel.HEADING_1),
    paragraph(`Delivery time: ${commercial.deliveryTime}. ${commercial.deliveryNotes}`),
    table(
      ["Stage", "Duration"],
      commercial.schedule.map((step) => [step.description, step.duration])
    ),
    heading("6. Commercial Terms", HeadingLevel.HEADING_1),
    table(
      ["Term", "Condition"],
      [
        ["Price basis", commercial.priceBasis],
        ["Included", commercial.priceInclusions],
        ["Exclusions", commercial.exclusions],
        ["Currency and validity", `Australian dollars (AUD); valid for ${commercial.validity}.`],
        ["Payment milestones", `${commercial.paymentAdvance}; ${commercial.paymentBalance}.`],
        ["Warranty", commercial.warranty],
        ["Liability", commercial.liability],
      ]
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 260 },
      children: [new TextRun({ text: "DRAFT - Commercial values and terms are editable and require review before issue.", font: "Arial", size: 16, color: "6B7280", italics: true })],
    }),
  ];

  const document = new Document({
    creator: "Truwater Technologies Australia Pty Ltd",
    title: `Commercial Proposal ${title}`,
    description: "Editable commercial proposal generated from the Documents form.",
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 20 },
          paragraph: { spacing: { after: 100 } },
        },
        heading1: {
          run: { font: "Arial", size: 24, bold: true, color: BLUE },
          paragraph: { spacing: { before: 260, after: 120 }, keepNext: true },
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

  const blob = await Packer.toBlob(document);
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").trim() || "Proposal";
  return { blob, fileName: `Commercial Proposal ${safeTitle}.docx` };
}