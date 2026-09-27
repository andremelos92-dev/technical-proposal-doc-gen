import Image from "next/image";

import { ProposalForm } from "@/components/proposal-form";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Truwater Document Generator</h1>
          <p className="text-muted-foreground mt-2">
            Fill in the fields below and generate the RFQ or the Technical Proposal as a Word (.docx)
            document.
          </p>
        </div>
        <Image
          src="/truwater-logo.png"
          alt="Truwater"
          width={506}
          height={113}
          priority
          className="h-10 w-auto shrink-0 self-end sm:h-12 sm:self-start"
        />
      </header>
      <ProposalForm />
    </main>
  );
}
