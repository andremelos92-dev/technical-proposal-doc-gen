"use client";

import { Fragment, useState } from "react";
import { FileDown, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";

import { CommercialProposal } from "@/components/commercial-proposal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  createInitialProposal,
  createRevision,
  FLOW_TYPES,
  MAX_REVISIONS,
  PARTNERS,
  proposalRecipient,
  referenceNumber,
  REVISION_PEOPLE,
  SPEC_ROWS,
  type ProposalData,
  type Recipient,
  type Revision,
  type SpecKey,
} from "@/lib/proposal";
import { DOCUMENTS, generateDocument, type DocumentKind } from "@/lib/templates";
import { cn } from "@/lib/utils";

type TextField = Exclude<
  keyof ProposalData,
  "spec" | "revisions" | "flowType" | "recipient" | "commercial"
>;

const RECIPIENT_OPTIONS: { value: Recipient; label: string }[] = [
  { value: "customer", label: "Customer" },
  ...PARTNERS.map((partner) => ({ value: partner.id, label: partner.region })),
  { value: "other", label: "Other" },
];

const ASAP = "ASAP";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const CONTACT_ROWS: {
  label: string;
  fields: { id: TextField; label: string; type?: string }[];
}[] = [
  {
    label: "Contact",
    fields: [
      { id: "contactName", label: "Name" },
      { id: "contactEmail", label: "Email", type: "email" },
      { id: "contactPhone", label: "Phone", type: "tel" },
    ],
  },
  {
    label: "Salesman",
    fields: [
      { id: "salesmanName", label: "Name" },
      { id: "salesmanEmail", label: "Email", type: "email" },
      { id: "salesmanPhone", label: "Phone", type: "tel" },
    ],
  },
];

type PersonColumn = keyof typeof REVISION_PEOPLE;

function isPersonColumn(key: keyof Revision): key is PersonColumn {
  return key in REVISION_PEOPLE;
}

/** The names offered for a sign-off column, keeping any other name already entered. */
function personOptions(column: PersonColumn, current: string): readonly string[] {
  const names: readonly string[] = REVISION_PEOPLE[column];
  return current && !names.includes(current) ? [...names, current] : names;
}

const REVISION_FIELDS: { key: keyof Revision; label: string; type?: string; width?: string }[] = [
  { key: "rev", label: "Rev.", width: "w-14" },
  { key: "date", label: "Date", type: "date", width: "w-38" },
  { key: "status", label: "Status", width: "w-28" },
  { key: "preparedBy", label: "Prepared By", width: "w-36" },
  { key: "checkedBy", label: "Checked By", width: "w-36" },
  { key: "approvedBy", label: "Approved By", width: "w-36" },
  { key: "remarks", label: "Remarks" },
];

export function ProposalForm() {
  const [data, setData] = useState<ProposalData>(createInitialProposal);
  const [activeTab, setActiveTab] = useState<"documents" | "commercial">("documents");
  const [generating, setGenerating] = useState<DocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAsap = data.dateQuoteRequired === ASAP;

  const setField = (field: TextField) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setData((prev) => ({ ...prev, [field]: event.target.value }));

  const setSpec = (key: SpecKey) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setData((prev) => ({ ...prev, spec: { ...prev.spec, [key]: event.target.value } }));

  const setRevision = (index: number, key: keyof Revision) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

  const field = (
    id: TextField,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
    className?: string
  ) => (
    <div className={cn("grid content-start gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={data[id]} onChange={setField(id)} {...props} />
    </div>
  );

  async function handleGenerate(kind: DocumentKind) {
    setGenerating(kind);
    setError(null);
    try {
      const { blob, fileName } = await generateDocument(kind, data);
      downloadBlob(blob, fileName);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while generating the document. Please try again.");
    } finally {
      setGenerating(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    await handleGenerate((submitter?.value ?? "rfq") as DocumentKind);
  }

  return (
    <div className="grid gap-6">
      <div className="flex border-b" role="tablist" aria-label="Document sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "documents"}
          onClick={() => setActiveTab("documents")}
          className={cn(
            "min-w-0 flex-1 whitespace-normal border-b-2 px-2 py-3 text-center text-sm font-medium transition-colors sm:px-4",
            activeTab === "documents"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          RFQ &amp; Technical Proposal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "commercial"}
          onClick={() => setActiveTab("commercial")}
          className={cn(
            "min-w-0 flex-1 whitespace-normal border-b-2 px-2 py-3 text-center text-sm font-medium transition-colors sm:px-4",
            activeTab === "commercial"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Commercial Proposal
        </button>
      </div>

      {activeTab === "commercial" ? (
        <CommercialProposal
          data={data}
          onChange={(updates) => setData((previous) => ({ ...previous, ...updates }))}
          onGenerate={() => void handleGenerate("commercial")}
          generating={generating === "commercial"}
          error={error}
        />
      ) : (
      <form onSubmit={handleSubmit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Used by both the RFQ and the Technical Proposal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-12">
            {field(
              "quoteNumber",
              "TTA Quote Number",
              { required: true, placeholder: "TTA0149" },
              "sm:col-span-3"
            )}
            {field(
              "projectName",
              "Project Name",
              { required: true, placeholder: "275 Kent St" },
              "sm:col-span-4"
            )}
            {field(
              "customerDetail",
              "Customer Detail",
              { placeholder: "Climatech NSW Pty Ltd" },
              "sm:col-span-5"
            )}
            {field(
              "projectAddress",
              "Project Address",
              { placeholder: "275 Kent Street, Sydney NSW 2000" },
              "sm:col-span-5"
            )}
            {field("date", "Date", { type: "date" }, "sm:col-span-3")}
            <div className="grid content-start gap-1.5 sm:col-span-4">
              <Label htmlFor="dateQuoteRequired">Date Quote Required</Label>
              <div className="flex gap-2">
                <Input
                  id="dateQuoteRequired"
                  type="date"
                  value={isAsap ? "" : data.dateQuoteRequired}
                  onChange={setField("dateQuoteRequired")}
                  disabled={isAsap}
                />
                <Button
                  type="button"
                  variant={isAsap ? "default" : "outline"}
                  aria-pressed={isAsap}
                  onClick={() =>
                    setData((prev) => ({ ...prev, dateQuoteRequired: isAsap ? "" : ASAP }))
                  }
                >
                  ASAP
                </Button>
              </div>
            </div>
          </div>

          <div className="grid items-center gap-x-3 gap-y-2 border-t pt-5 sm:grid-cols-[5.5rem_1fr_1.3fr_1fr]">
            <span className="text-sm font-semibold">Contacts</span>
            {["Name", "Email", "Phone"].map((heading) => (
              <span key={heading} className="text-muted-foreground hidden text-xs font-medium sm:block">
                {heading}
              </span>
            ))}
            {CONTACT_ROWS.map((row) => (
              <Fragment key={row.label}>
                <Label className="text-muted-foreground mt-2 sm:mt-0">{row.label}</Label>
                {row.fields.map(({ id, label, type }) => (
                  <Input
                    key={id}
                    id={id}
                    type={type}
                    aria-label={`${row.label} ${label.toLowerCase()}`}
                    placeholder={label}
                    value={data[id]}
                    onChange={setField(id)}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="gap-4 py-5">
        <CardHeader className="flex items-center gap-2">
          <CardTitle>Message</CardTitle>
          <span className="text-muted-foreground rounded-full border px-2 py-0.5 text-xs font-medium">
            RFQ only
          </span>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-12">
          {field("greeting", "Greeting", {}, "sm:col-span-3")}
          {field("summaryIntro", "Summary", {}, "sm:col-span-4")}
          {field(
            "folderLink",
            "Link To Folder",
            { type: "url", placeholder: "Optional – paste folder link" },
            "sm:col-span-5"
          )}
        </CardContent>
      </Card>

      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle>Cooling Tower Specification</CardTitle>
        </CardHeader>
        {/* Fills down the left column first, so the order matches the RFQ table. */}
        <CardContent className="grid gap-x-8 gap-y-2 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-8">
          {SPEC_ROWS.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
            >
              <Label htmlFor={row.key} className="block leading-snug">
                {row.label}
                {row.unit && (
                  <span className="text-muted-foreground ml-1.5 text-xs font-normal whitespace-nowrap">
                    {row.unit}
                  </span>
                )}
              </Label>
              <Input
                id={row.key}
                value={data.spec[row.key]}
                onChange={setSpec(row.key)}
                placeholder={row.example}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Proposal Cover</CardTitle>
          <CardDescription>
            The cover also uses the quote number and project name above.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label>Addressed To</Label>
            <div className="flex flex-wrap gap-2">
              {RECIPIENT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={data.recipient === option.value ? "default" : "outline"}
                  aria-pressed={data.recipient === option.value}
                  onClick={() => setData((prev) => ({ ...prev, recipient: option.value }))}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {data.recipient === "other" && (
              <Input
                aria-label="Other recipient"
                placeholder="Type the company name for the cover"
                value={data.otherRecipient}
                onChange={setField("otherRecipient")}
                className="sm:max-w-md"
              />
            )}
            <p className="text-muted-foreground text-sm">
              Printed on cover:{" "}
              {proposalRecipient(data) ? (
                <span className="text-foreground font-medium">{proposalRecipient(data)}</span>
              ) : data.recipient === "customer" ? (
                "fill in Customer Detail above"
              ) : (
                "type a company name"
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Tower Type</Label>
              <div className="flex gap-2">
                {FLOW_TYPES.map((flowType) => (
                  <Button
                    key={flowType}
                    type="button"
                    className="flex-1"
                    variant={data.flowType === flowType ? "default" : "outline"}
                    aria-pressed={data.flowType === flowType}
                    onClick={() => setData((prev) => ({ ...prev, flowType }))}
                  >
                    {flowType}
                  </Button>
                ))}
              </div>
            </div>
            {field("towerModel", "Model", { placeholder: "ECF1212F4-1B-1" })}
            <div className="grid gap-2">
              <Label>Reference No.</Label>
              <p className="flex h-9 items-center text-sm">
                {referenceNumber(data) ? (
                  <span className="font-medium">{referenceNumber(data)}</span>
                ) : (
                  <span className="text-muted-foreground">Fills in from the TTA Quote Number</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Revisions</Label>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] table-fixed border-separate border-spacing-1 text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    {REVISION_FIELDS.map((column) => (
                      <th key={column.key} className={cn("font-medium", column.width)}>
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
                        <td key={column.key}>
                          {isPersonColumn(column.key) ? (
                            <NativeSelect
                              aria-label={`${column.label} (row ${index + 1})`}
                              value={revision[column.key]}
                              onChange={setRevision(index, column.key)}
                            >
                              <option value="">–</option>
                              {personOptions(column.key, revision[column.key]).map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </NativeSelect>
                          ) : (
                            <Input
                              aria-label={`${column.label} (row ${index + 1})`}
                              type={column.type}
                              value={revision[column.key]}
                              onChange={setRevision(index, column.key)}
                            />
                          )}
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
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRevision}
                disabled={data.revisions.length >= MAX_REVISIONS}
              >
                <Plus /> Add Revision
              </Button>
              <span className="text-muted-foreground text-xs">
                Up to {MAX_REVISIONS} revisions fit in the table.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => setData(createInitialProposal())}>
          <RotateCcw /> Reset
        </Button>
        {(Object.keys(DOCUMENTS) as (keyof typeof DOCUMENTS)[]).map((kind) => (
          <Button key={kind} type="submit" value={kind} size="lg" disabled={!!generating}>
            {generating === kind ? <Loader2 className="animate-spin" /> : <FileDown />}
            {DOCUMENTS[kind].label}
          </Button>
        ))}
      </div>
      </form>
      )}
    </div>
  );
}
