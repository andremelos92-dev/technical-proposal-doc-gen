# Technical Proposal Doc Gen

A Next.js + shadcn/ui app that turns one form into Truwater Word documents (.docx):

- **RFQ**: the Quotation Project Summary (A4 landscape, Aptos)
- **Technical Proposal**: the cover page (A4 portrait, Arial)

Each document is filled from a real Word template in `public/templates/`, so the logo, photos, fonts,
sizes, borders and footer come straight from the original files. Filling happens in the browser with
[docxtemplater](https://docxtemplater.com).

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, fill in the form and click **RFQ** or **Technical Proposal**.

## Templates

| Template | Placeholders |
| --- | --- |
| `public/templates/rfq.docx` | `{documentTitle}` (title + footer), `{projectTitle}`, `{projectAddress}`, `{quoteNumber}`, `{date}`, `{dateQuoteRequired}`, `{customerDetail}`, `{contactName}`, `{contactEmail}`, `{contactPhone}`, `{salesmanName}`, `{salesmanEmail}`, `{salesmanPhone}`, `{greeting}`, `{summaryIntro}`, `{#folderLink}…{/folderLink}`, `{spec_<key>}` for each row in `SPEC_ROWS` |
| `public/templates/technical-proposal.docx` | `{projectTitle}`, `{customerDetail}`, `{modelLine}`, `{referenceNumber}`, `{r1_rev}` … `{r5_remarks}` (revision rows 1–5: `rev`, `date`, `status`, `preparedBy`, `checkedBy`, `approvedBy`, `remarks`) |

To change a layout, open the template in Word, edit it, and keep the `{placeholders}` where the values go.
Whatever formatting a placeholder has (font, size, bold, colour) is what the filled value gets.

### Adding a new document

1. Save the Word file into `public/templates/`, typing `{placeholders}` where the form values should go.
2. Add an entry to `DOCUMENTS` in `src/lib/templates.ts` with its label, template path, file name and a
   function mapping the form data to the placeholders.

A download button for it appears automatically at the bottom of the form.

## Where things live

- `src/lib/proposal.ts`: form fields, default values, spec rows, reference number
- `src/lib/templates.ts`: document registry and template filling
- `src/components/proposal-form.tsx`: the form UI
- `src/components/ui/*`: shadcn/ui components
