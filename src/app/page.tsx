import { ProposalForm } from "@/components/proposal-form";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Quotation Project Summary</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the fields below and generate the summary as a Word (.docx) document.
        </p>
      </header>
      <ProposalForm />
    </main>
  );
}
