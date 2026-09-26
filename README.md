# Technical Proposal Doc Gen

A Next.js + shadcn/ui app that turns a form into a **Quotation Project Summary** Word document (.docx).
The document is generated entirely in the browser with the [`docx`](https://docx.js.org) library.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, fill in the form and click **Generate Word document**.

## Logo

Put the company logo at `public/truwater-logo.png` (PNG). It is placed in the top-right of the
document header. Without it, a text "TRUWATER" placeholder is used instead.

## Where things live

- `src/lib/proposal.ts` – form fields, default values and the tower specification rows
- `src/lib/generate-docx.ts` – builds the Word document layout (tables, header, footer)
- `src/components/proposal-form.tsx` – the form UI
- `src/components/ui/*` – shadcn/ui components
