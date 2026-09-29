import {
  formatDate,
  projectTitle,
  proposalRecipient,
  referenceNumber,
  resolvedCommercialTowers,
  PORTS,
  SIGNATORIES,
  towerSpecKey,
  towerTotal,
  type CommercialProposalData,
  type SignatoryId,
  type CommercialTower,
  type ProposalData,
  type SpecKey,
} from "@/lib/proposal";
import { RevisionsEditor } from "@/components/revisions-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { FileDown, Loader2 } from "lucide-react";

type CommercialProposalProps = {
  data: ProposalData;
  onChange: (updates: Partial<ProposalData>) => void;
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
};

const TOWER_FIELDS: { key: keyof CommercialTower; label: string; type?: string; placeholder?: string }[] = [
  { key: "equipment", label: "Equipment No." },
  { key: "model", label: "Cooling Tower Model" },
  { key: "cells", label: "No. Of Cells" },
  { key: "arrangement", label: "Arrangement", placeholder: "In-Line" },
  { key: "flowRate", label: "Design Flowrate", placeholder: "e.g. 73 (L/s)" },
  { key: "hotTemperature", label: "Hot (Inlet) Water Temp", placeholder: "e.g. 35" },
  { key: "coldTemperature", label: "Cold (Outlet) Water Temp", placeholder: "e.g. 29.5" },
  { key: "wetBulb", label: "Wet Bulb Temp", placeholder: "e.g. 23" },
  { key: "material", label: "Material Of Construction" },
  { key: "driveType", label: "Type Of Drive" },
  { key: "motor", label: "Motor kW", placeholder: "e.g. 11" },
  { key: "infill", label: "Type Of Infill" },
  { key: "supportBase", label: "Mechanical Support Base", placeholder: "Same as material" },
  { key: "basin", label: "Cold Water Basin", placeholder: "Same as material" },
];

const OTHER_PORT = "__other";

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

export function CommercialProposal({
  data,
  onChange,
  onGenerate,
  generating,
  error,
}: CommercialProposalProps) {
  const title = projectTitle(data) || "Project name from Documents form";
  const recipient = proposalRecipient(data) || "Customer from Documents form";
  const updateCommercial = (commercial: CommercialProposalData) => onChange({ commercial });
  const updateCommercialField = <K extends keyof CommercialProposalData>(
    key: K,
    value: CommercialProposalData[K]
  ) => updateCommercial({ ...data.commercial, [key]: value });
  const towers = resolvedCommercialTowers(data);

  const setTowerField = (index: number, key: keyof CommercialTower, value: string) => {
    if (index === 0 && key === "model") {
      onChange({ towerModel: value });
      return;
    }
    // Fields linked to the RFQ specification are edited there, so both stay the same.
    const specKey = towerSpecKey(index, key);
    if (specKey) {
      onChange({ spec: { ...data.spec, [specKey]: value } });
      return;
    }
    updateCommercialField(
      "towers",
      data.commercial.towers.map((tower, towerIndex) =>
        towerIndex === index ? { ...tower, [key]: value } : tower
      )
    );
  };

  const setScopeField = (index: number, key: "description" | "responsibility", value: string) =>
    updateCommercialField(
      "scope",
      data.commercial.scope.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );

  const setScheduleField = (index: number, key: "description" | "duration", value: string) =>
    updateCommercialField(
      "schedule",
      data.commercial.schedule.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [key]: value } : step
      )
    );

  const total = towers.reduce((sum, tower) => sum + (Number(towerTotal(tower)) || 0), 0);

  function textInput(label: string, value: string, onValue: (value: string) => void, type = "text") {
    const id = `commercial-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return (
      <div className="grid content-start gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} type={type} value={value} onChange={(event) => onValue(event.target.value)} />
      </div>
    );
  }

  function textArea(label: string, value: string, onValue: (value: string) => void, className?: string) {
    const id = `commercial-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return (
      <div className="grid content-start gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Textarea id={id} value={value} onChange={(event) => onValue(event.target.value)} className={className} />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6" role="tabpanel" aria-label="Commercial Proposal">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div className="min-w-0">
          <p className="text-primary text-xs font-semibold uppercase">Commercial Proposal Demo</p>
          <h2 className="mt-1 break-words text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-1">Cooling tower supply · Truwater Technologies Australia Pty Ltd</p>
        </div>
        <div className="border-l-2 border-primary pl-3 text-sm">
          <p className="font-semibold">EDITABLE DRAFT</p>
          <p className="text-muted-foreground">Review before issue</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proposal Cover</CardTitle>
          <CardDescription>These values are copied directly from the RFQ and Technical Proposal fields.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Project" value={title} />
            <Detail label="Client" value={recipient} />
            <div className="grid content-start gap-1.5">
              <Label htmlFor="commercial-attention">ATTN.</Label>
              <Input
                id="commercial-attention"
                placeholder="e.g. Aaron Hughes & Cale Watson"
                value={data.commercial.attention}
                onChange={(event) => updateCommercialField("attention", event.target.value)}
              />
            </div>
            <Detail label="Project address" value={data.projectAddress || "Project address from Documents form"} />
            <Detail label="TTA quote number" value={data.quoteNumber || "Quote number from Documents form"} />
            <Detail label="Reference number" value={referenceNumber(data) || "Generated from quote number and date"} />
            <Detail label="Proposal date" value={formatDate(data.date)} />
            <Detail label="Subject" value={title} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["signature1", "signature2"] as const).map((key, index) => (
              <div key={key} className="grid content-start gap-1.5">
                <Label htmlFor={`commercial-${key}`}>Signature {index + 1}</Label>
                <NativeSelect
                  id={`commercial-${key}`}
                  value={data.commercial[key]}
                  onChange={(event) => updateCommercialField(key, event.target.value as SignatoryId)}
                >
                  {SIGNATORIES.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} – {person.title}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ))}
          </div>
          <RevisionsEditor
            revisions={data.commercial.revisions}
            onChange={(revisions) => updateCommercialField("revisions", revisions)}
          />
        </CardContent>
      </Card>

      <section className="grid gap-4" aria-labelledby="pricing-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 id="pricing-heading" className="text-lg font-semibold">Pricing Schedule</h3>
            <p className="text-muted-foreground text-sm">Edit tower-specific values and pricing below.</p>
          </div>
          <div className="grid min-w-40 gap-1.5">
            <Label htmlFor="commercial-flow-type">Tower type</Label>
            <NativeSelect
              id="commercial-flow-type"
              value={data.flowType}
              onChange={(event) => onChange({ flowType: event.target.value as ProposalData["flowType"] })}
            >
              <option value="Counterflow">Counterflow</option>
              <option value="Crossflow">Crossflow</option>
            </NativeSelect>
          </div>
        </div>
        {towers.map((tower, index) => (
          <Card key={`${tower.equipment}-${index}`}>
            <CardHeader>
              <CardTitle>{tower.equipment || `Cooling tower ${index + 1}`}</CardTitle>
              <CardDescription>Equipment details and material price (C&amp;F {tower.port || "…"} Port).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-4 border-b pb-4 sm:col-span-2 sm:grid-cols-3 lg:col-span-3">
                <div className="grid content-start gap-1.5">
                  <Label htmlFor={`commercial-tower-${index}-price`}>1.1 Price For Cooling Tower Material (AUD)</Label>
                  <Input
                    id={`commercial-tower-${index}-price`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 389449"
                    value={tower.price}
                    onChange={(event) => setTowerField(index, "price", event.target.value)}
                  />
                </div>
                <div className="grid content-start gap-1.5">
                  <Label htmlFor={`commercial-tower-${index}-quantity`}>Quantity</Label>
                  <Input
                    id={`commercial-tower-${index}-quantity`}
                    type="number"
                    min="1"
                    step="1"
                    value={tower.quantity}
                    onChange={(event) => setTowerField(index, "quantity", event.target.value)}
                  />
                </div>
                <div className="grid content-start gap-1.5">
                  <Label htmlFor={`commercial-tower-${index}-port`}>C&amp;F Port (1.2 / 1.3)</Label>
                  <NativeSelect
                    id={`commercial-tower-${index}-port`}
                    value={(PORTS as readonly string[]).includes(tower.port) ? tower.port : OTHER_PORT}
                    onChange={(event) =>
                      setTowerField(index, "port", event.target.value === OTHER_PORT ? "" : event.target.value)
                    }
                  >
                    {PORTS.map((port) => (
                      <option key={port} value={port}>
                        {port}
                      </option>
                    ))}
                    <option value={OTHER_PORT}>Other…</option>
                  </NativeSelect>
                  {!(PORTS as readonly string[]).includes(tower.port) && (
                    <Input
                      aria-label="Other port"
                      placeholder="Type the port name, e.g. Newcastle"
                      value={tower.port}
                      onChange={(event) => setTowerField(index, "port", event.target.value)}
                    />
                  )}
                </div>
                <p className="text-muted-foreground text-sm sm:col-span-3">
                  1.2 &amp; 1.3 (price × quantity):{" "}
                  <span className="text-foreground font-semibold">
                    {tower.price.trim() ? currency.format(Number(towerTotal(tower)) || 0) : "—"}
                  </span>
                </p>
              </div>
              {TOWER_FIELDS.map(({ key, label, type, placeholder }) => (
                <div key={key} className="grid content-start gap-1.5">
                  <Label htmlFor={`commercial-tower-${index}-${key}`}>
                    {label}
                    {(towerSpecKey(index, key) || (index === 0 && key === "model")) && (
                      <span className="text-primary text-[10px] font-semibold">
                        {key === "model" ? "TECH PROP" : "RFQ"}
                      </span>
                    )}
                  </Label>
                  <Input
                    id={`commercial-tower-${index}-${key}`}
                    placeholder={placeholder}
                    type={type ?? "text"}
                    min={type === "number" ? "0" : undefined}
                    step={type === "number" ? "0.01" : undefined}
                    value={tower[key]}
                    onChange={(event) => setTowerField(index, key, event.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 border-y-2 border-primary bg-primary/5 px-5 py-4">
          <div>
            <p className="font-semibold">Total lump sum · cooling tower materials</p>
            <p className="text-muted-foreground text-sm">C&F Brisbane Port · GST excluded</p>
          </div>
          <p className="text-xl font-bold">{currency.format(total)}</p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Scope of Supply</CardTitle>
          <CardDescription>Edit scope descriptions and select who is responsible.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Description</th>
                  <th className="w-36 py-2 font-medium">Responsibility</th>
                </tr>
              </thead>
              <tbody>
                {data.commercial.scope.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <Input
                        aria-label={`Scope item ${index + 1}`}
                        value={item.description}
                        onChange={(event) => setScopeField(index, "description", event.target.value)}
                      />
                    </td>
                    <td className="py-2">
                      <NativeSelect
                        aria-label={`Scope responsibility ${index + 1}`}
                        value={item.responsibility}
                        onChange={(event) => setScopeField(index, "responsibility", event.target.value)}
                      >
                        <option value="Truwater">Truwater</option>
                        <option value="Optional">Optional</option>
                        <option value="Purchaser">Purchaser</option>
                      </NativeSelect>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {textArea("Construction and commissioning spares", data.commercial.constructionSpares, (value) => updateCommercialField("constructionSpares", value))}
          {textArea("Special tools included", data.commercial.specialTools, (value) => updateCommercialField("specialTools", value))}
          {textArea("Recommended two-year spares (optional)", data.commercial.recommendedSpares, (value) => updateCommercialField("recommendedSpares", value))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optional Items and Services</CardTitle>
          <CardDescription>Rates are editable; travel and accommodation remain separate.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {textInput("Erection supervision (AUD / man-day)", data.commercial.erectionRate, (value) => updateCommercialField("erectionRate", value), "number")}
          {textInput("Commissioning supervision (AUD / man-day)", data.commercial.commissioningRate, (value) => updateCommercialField("commissioningRate", value), "number")}
          {textInput("Overtime Monday-Saturday (AUD / hour)", data.commercial.overtimeWeekdayRate, (value) => updateCommercialField("overtimeWeekdayRate", value), "number")}
          {textInput("Overtime Sunday (AUD / hour)", data.commercial.overtimeSundayRate, (value) => updateCommercialField("overtimeSundayRate", value), "number")}
          {textInput("Overtime public holidays (AUD / hour)", data.commercial.overtimeHolidayRate, (value) => updateCommercialField("overtimeHolidayRate", value), "number")}
          {textArea("Travel and accommodation terms", data.commercial.travelTerms, (value) => updateCommercialField("travelTerms", value), "min-h-20")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchaser Responsibilities</CardTitle>
          <CardDescription>Applies when Truwater or its supervisory services are engaged for tower erection.</CardDescription>
        </CardHeader>
        <CardContent>
          {textArea("Purchaser responsibilities (one item per line)", data.commercial.purchaserResponsibilities, (value) => updateCommercialField("purchaserResponsibilities", value), "min-h-40")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Schedule</CardTitle>
          <CardDescription>Edit the total delivery duration, notes and stage estimates.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {textInput("Delivery time", data.commercial.deliveryTime, (value) => updateCommercialField("deliveryTime", value))}
          {textInput("Delivery notes", data.commercial.deliveryNotes, (value) => updateCommercialField("deliveryNotes", value))}
          {data.commercial.schedule.map((step, index) => (
            <div key={index} className="grid gap-3 border-l-2 border-primary/40 pl-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
              {textInput(`Stage ${index + 1}`, step.description, (value) => setScheduleField(index, "description", value))}
              {textInput(`Duration ${index + 1}`, step.duration, (value) => setScheduleField(index, "duration", value))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commercial Terms</CardTitle>
          <CardDescription>Edit the commercial conditions before generating the Word document.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {textArea("Price basis", data.commercial.priceBasis, (value) => updateCommercialField("priceBasis", value))}
          {textArea("Price inclusions", data.commercial.priceInclusions, (value) => updateCommercialField("priceInclusions", value))}
          {textArea("Exclusions", data.commercial.exclusions, (value) => updateCommercialField("exclusions", value))}
          {textInput("Proposal validity", data.commercial.validity, (value) => updateCommercialField("validity", value))}
          {textArea("Advance payment", data.commercial.paymentAdvance, (value) => updateCommercialField("paymentAdvance", value))}
          {textArea("Balance payment", data.commercial.paymentBalance, (value) => updateCommercialField("paymentBalance", value))}
          {textArea("Warranty", data.commercial.warranty, (value) => updateCommercialField("warranty", value))}
          {textArea("Liability", data.commercial.liability, (value) => updateCommercialField("liability", value))}
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
      <div className="flex justify-end">
        <Button type="button" size="lg" disabled={generating} onClick={onGenerate}>
          {generating ? <Loader2 className="animate-spin" /> : <FileDown />}
          Generate Commercial Proposal
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-sm leading-relaxed">{value}</p>
    </div>
  );
}