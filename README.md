# Technical Proposal Doc Gen

A Next.js + shadcn/ui app that turns a form into a **Cooling Tower Technical Proposal** Word document (.docx):

1. **Cover page** (A4 portrait) – photo collage, logo, project/customer, model, reference number, revision table
2. **Quotation Project Summary** (A4 landscape) – project details table, message and tower specification

The document is generated entirely in the browser with the [`docx`](https://docx.js.org) library.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, fill in the form and click **Technical proposal**.

## Images

Put these files in `public/`; the document falls back gracefully when they are missing.

| File | Used for | Fallback |
| --- | --- | --- |
| `truwater-logo.png` | Logo on the cover and the summary header | "TRUWATER" in blue text |
| `proposal-cover.png` or `proposal-cover.jpg` | Photo collage at the top-left of the cover | Blank space |

## Where things live

- `src/lib/proposal.ts` – form fields, default values, spec rows, reference number
- `src/lib/docx/technical-proposal.ts` – builds the document; cover page layout
- `src/lib/docx/quotation-summary.ts` – Quotation Project Summary page (section 2)
- `src/lib/docx/shared.ts` – helpers shared by both pages (tables, images, logo)
- `src/components/proposal-form.tsx` – the form UI
- `src/components/ui/*` – shadcn/ui components
