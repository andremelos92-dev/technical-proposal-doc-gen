import type { Metadata } from "next";

import { ProposalForm } from "@/components/proposal-form";

export const metadata: Metadata = { title: "Documents · Truwater Document Generator" };

export default function DocumentsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the fields below and generate the RFQ or the Technical Proposal as a Word (.docx)
          document.
        </p>
      </header>
      <ProposalForm />
    </main>
  );
}
