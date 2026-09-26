# Technical Proposal Doc Gen

A Next.js + shadcn/ui app that turns one form into two Word documents (.docx):

- **Quotation Project Summary** – the internal A4 landscape summary for the engineers
- **Technical Proposal** – the customer-facing proposal, starting with its cover page

The documents are generated entirely in the browser with the [`docx`](https://docx.js.org) library.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, fill in the form and click **Quotation summary** or **Technical proposal**.

## Images

Put these files in `public/`; the documents fall back gracefully when they are missing.

| File | Used for | Fallback |
| --- | --- | --- |
| `truwater-logo.png` | Logo on both documents | "TRUWATER" in blue text |
| `proposal-cover.png` or `proposal-cover.jpg` | Photo collage at the top-left of the proposal cover | Blank space |

## Where things live

- `src/lib/proposal.ts` – form fields, default values, spec rows, reference number
- `src/lib/docx/quotation-summary.ts` – Quotation Project Summary layout
- `src/lib/docx/technical-proposal.ts` – Technical Proposal layout (cover page)
- `src/lib/docx/shared.ts` – helpers shared by both documents (tables, images, logo)
- `src/components/proposal-form.tsx` – the form UI
- `src/components/ui/*` – shadcn/ui components
