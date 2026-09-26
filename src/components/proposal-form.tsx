"use client";

import { useState } from "react";
import { FileDown, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateProposalDocx, proposalFileName } from "@/lib/generate-docx";
import { createInitialProposal, SPEC_ROWS, type ProposalData, type SpecKey } from "@/lib/proposal";

type TextField = Exclude<keyof ProposalData, "spec">;

export function ProposalForm() {
  const [data, setData] = useState<ProposalData>(createInitialProposal);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: TextField) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setData((prev) => ({ ...prev, [field]: event.target.value }));

  const setSpec = (key: SpecKey) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setData((prev) => ({ ...prev, spec: { ...prev.spec, [key]: event.target.value } }));

  const field = (id: TextField, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={data[id]} onChange={setField(id)} {...props} />
    </div>
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setGenerating(true);
    setError(null);
    try {
      const blob = await generateProposalDocx(data);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = proposalFileName(data);
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while generating the document. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>Shown in the summary table at the top of the document.</CardDescription>
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
          <div className="sm:col-span-2">{field("customerDetail", "Customer Detail")}</div>
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

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => setData(createInitialProposal())}>
          <RotateCcw /> Reset
        </Button>
        <Button type="submit" size="lg" disabled={generating}>
          {generating ? <Loader2 className="animate-spin" /> : <FileDown />}
          Generate Word document
        </Button>
      </div>
    </form>
  );
}
