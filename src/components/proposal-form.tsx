"use client";

import { useState } from "react";
import { FileDown, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateQuotationSummary, quotationSummaryFileName } from "@/lib/docx/quotation-summary";
import { downloadBlob } from "@/lib/docx/shared";
import {
  generateTechnicalProposal,
  technicalProposalFileName,
} from "@/lib/docx/technical-proposal";
import {
  createInitialProposal,
  createRevision,
  referenceNumber,
  SPEC_ROWS,
  type ProposalData,
  type Revision,
  type SpecKey,
} from "@/lib/proposal";

type TextField = Exclude<keyof ProposalData, "spec" | "revisions">;

const DOCUMENTS = {
  summary: { generate: generateQuotationSummary, fileName: quotationSummaryFileName },
  proposal: { generate: generateTechnicalProposal, fileName: technicalProposalFileName },
};

type DocumentKind = keyof typeof DOCUMENTS;

const REVISION_FIELDS: { key: keyof Revision; label: string; type?: string }[] = [
  { key: "rev", label: "Rev." },
  { key: "date", label: "Date", type: "date" },
  { key: "status", label: "Status" },
  { key: "preparedBy", label: "Prepared By" },
  { key: "checkedBy", label: "Checked By" },
  { key: "approvedBy", label: "Approved By" },
  { key: "remarks", label: "Remarks" },
];

export function ProposalForm() {
  const [data, setData] = useState<ProposalData>(createInitialProposal);
  const [generating, setGenerating] = useState<DocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: TextField) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setData((prev) => ({ ...prev, [field]: event.target.value }));

  const setSpec = (key: SpecKey) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setData((prev) => ({ ...prev, spec: { ...prev.spec, [key]: event.target.value } }));

  const setRevision = (index: number, key: keyof Revision) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) =>
    setData((prev) => ({
      ...prev,
      revisions: prev.revisions.map((revision, i) =>
        i === index ? { ...revision, [key]: event.target.value } : revision
      ),
    }));

  const addRevision = () =>
    setData((prev) => ({
      ...prev,
      revisions: [...prev.revisions, createRevision(String(prev.revisions.length))],
    }));

  const removeRevision = (index: number) =>
    setData((prev) => ({ ...prev, revisions: prev.revisions.filter((_, i) => i !== index) }));

  const field = (id: TextField, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={data[id]} onChange={setField(id)} {...props} />
    </div>
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const kind = (submitter?.value ?? "summary") as DocumentKind;
    const { generate, fileName } = DOCUMENTS[kind];

    setGenerating(kind);
    setError(null);
    try {
      downloadBlob(await generate(data), fileName(data));
    } catch (err) {
      console.error(err);
      setError("Something went wrong while generating the document. Please try again.");
    } finally {
      setGenerating(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>Used by both documents.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("projectName", "Project Name", { required: true, placeholder: "Redcliff Hospital" })}
          {field("quoteNumber", "TTA Quote Number", { required: true, placeholder: "TTA0012" })}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="projectAddress">Project Address</Label>
            <Textarea
              id="projectAddress"
              value={data.projectAddress}
              onChange={setField("projectAddress")}
              rows={2}
            />
          </div>
          {field("date", "Date", { type: "date" })}
          {field("dateQuoteRequired", "Date Quote Required", { type: "date" })}
          <div className="sm:col-span-2">
            {field("customerDetail", "Customer Detail", { placeholder: "Ford Consulting" })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {field("contactName", "Contact name")}
            {field("contactEmail", "Contact email", { type: "email" })}
            {field("contactPhone", "Contact phone", { type: "tel" })}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {field("salesmanName", "Salesman name")}
            {field("salesmanEmail", "Salesman email", { type: "email" })}
            {field("salesmanPhone", "Salesman phone", { type: "tel" })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
          <CardDescription>Quotation summary only.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {field("greeting", "Greeting")}
          <div className="grid gap-2">
            <Label htmlFor="summaryIntro">Summary</Label>
            <Textarea
              id="summaryIntro"
              value={data.summaryIntro}
              onChange={setField("summaryIntro")}
              rows={3}
            />
          </div>
          {field("folderLink", "Link to folder", { type: "url", placeholder: "https://…" })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cooling tower specification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {SPEC_ROWS.map((row) => (
            <div key={row.key} className="grid grid-cols-[1fr_3.5rem_2fr] items-center gap-3">
              <Label htmlFor={row.key}>{row.label}</Label>
              <span className="text-muted-foreground text-center text-sm">{row.unit}</span>
              <Input id={row.key} value={data.spec[row.key]} onChange={setSpec(row.key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessories</CardTitle>
          <CardDescription>One accessory per line; each becomes a bullet point.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            aria-label="Accessories"
            value={data.accessories}
            onChange={setField("accessories")}
            rows={5}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical proposal cover</CardTitle>
          <CardDescription>
            The cover also uses the project name, quote number, customer and tower type above.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("towerModel", "Tower model", { placeholder: "VXF2220X-1" })}
            <div className="grid gap-2">
              <Label>Reference No.</Label>
              <p className="text-muted-foreground flex h-9 items-center text-sm">
                {referenceNumber(data)}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Revisions</Label>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-1 text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    {REVISION_FIELDS.map((column) => (
                      <th key={column.key} className="font-medium">
                        {column.label}
                      </th>
                    ))}
                    <th className="w-9">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.revisions.map((revision, index) => (
                    <tr key={index}>
                      {REVISION_FIELDS.map((column) => (
                        <td key={column.key} className={column.key === "rev" ? "w-16" : undefined}>
                          <Input
                            aria-label={`${column.label} (row ${index + 1})`}
                            type={column.type}
                            value={revision[column.key]}
                            onChange={setRevision(index, column.key)}
                          />
                        </td>
                      ))}
                      <td>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove revision ${revision.rev || index + 1}`}
                          onClick={() => removeRevision(index)}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <Button type="button" variant="outline" size="sm" onClick={addRevision}>
                <Plus /> Add revision
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => setData(createInitialProposal())}>
          <RotateCcw /> Reset
        </Button>
        <Button type="submit" value="summary" variant="secondary" size="lg" disabled={!!generating}>
          {generating === "summary" ? <Loader2 className="animate-spin" /> : <FileDown />}
          Quotation summary
        </Button>
        <Button type="submit" value="proposal" size="lg" disabled={!!generating}>
          {generating === "proposal" ? <Loader2 className="animate-spin" /> : <FileDown />}
          Technical proposal
        </Button>
      </div>
    </form>
  );
}
