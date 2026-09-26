import {
  AlignmentType,
  BorderStyle,
  ImageRun,
  Paragraph,
  TableCell,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

export const FONT = "Arial";
export const TEXT_SIZE = 18; // half-points -> 9pt
export const LOGO_URL = "/truwater-logo.png";

// A4 in twips (portrait).
export const A4_WIDTH = 11906;
export const A4_HEIGHT = 16838;

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

type Alignment = (typeof AlignmentType)[keyof typeof AlignmentType];

type RunOptions = { bold?: boolean; size?: number };

/** Turns a (possibly multi-line) string into runs separated by line breaks. */
export function runs(value: string, { bold = false, size = TEXT_SIZE }: RunOptions = {}): TextRun[] {
  return value.split(/\r?\n/).map(
    (line, index) => new TextRun({ text: line, font: FONT, size, bold, break: index > 0 ? 1 : 0 })
  );
}

type CellOptions = RunOptions & { columnSpan?: number; align?: Alignment };

export function cell(value: string, width: number, options: CellOptions = {}): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: options.columnSpan,
    borders: BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { left: 100, right: 100, top: 20, bottom: 20 },
    children: [
      new Paragraph({
        alignment: options.align,
        children: runs(value, { bold: options.bold, size: options.size }),
      }),
    ],
  });
}

export type LoadedImage = {
  data: ArrayBuffer;
  type: "png" | "jpg";
  width: number;
  height: number;
};

/** Fetches an image from /public; returns null when it is missing or not a PNG/JPEG. */
export async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    const type = contentType.includes("png") ? "png" : contentType.includes("jpeg") ? "jpg" : null;
    if (!type) return null;

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;
    bitmap.close();
    return { data: await blob.arrayBuffer(), type, width, height };
  } catch {
    return null;
  }
}

/** Returns the first of the given URLs that loads as an image. */
export async function loadFirstImage(urls: string[]): Promise<LoadedImage | null> {
  for (const url of urls) {
    const image = await loadImage(url);
    if (image) return image;
  }
  return null;
}

/** An inline image scaled to the given width in pixels, keeping its aspect ratio. */
export function imageRun(image: LoadedImage, widthPx: number): ImageRun {
  return new ImageRun({
    type: image.type,
    data: image.data,
    transformation: { width: widthPx, height: Math.round((image.height / image.width) * widthPx) },
  });
}

/** Right-aligned company logo, or a text placeholder when the logo file is missing. */
export function logoParagraph(
  logo: LoadedImage | null,
  heightPx: number,
  spacing?: { before?: number; after?: number }
): Paragraph {
  const children = logo
    ? [imageRun(logo, Math.round((logo.width / logo.height) * heightPx))]
    : [
        new TextRun({
          text: "TRUWATER",
          font: FONT,
          size: Math.round(heightPx * 1.1),
          bold: true,
          color: "1E9AD6",
        }),
      ];
  return new Paragraph({ alignment: AlignmentType.RIGHT, spacing, children });
}

export function safeFileName(parts: string[], suffix: string): string {
  const base = [...parts, suffix].filter((part) => part.trim()).join(" - ");
  return `${base.replace(/[\\/:*?"<>|]/g, "").trim()}.docx`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
