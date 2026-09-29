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
    // Fields linked to this tower type's specification are edited there, so both stay the same.
    const specKey = towerSpecKey(key);
    if (specKey) {
      if (index === 0) onChange({ spec: { ...data.spec, [specKey]: value } });
      else
        onChange({
          extraSpecs: data.extraSpecs.map((spec, i) => (i === index - 1 ? { ...spec, [specKey]: value } : spec)),
        });
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

  const total = towers.reduce((sum, tower) => sum + (Number(towerTotal(tower)) || 0), 0);

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
                    {(towerSpecKey(key) || (index === 0 && key === "model")) && (
                      <span className="text-primary text-[10px] font-semibold">
                        {key === "model" ? "TECH PROP" : index === 0 ? "RFQ" : `SPEC ${index + 1}`}
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
          <CardDescription>
            Items supplied by Truwater. The Optional and By Purchaser items stay in the document as they are.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {data.commercial.scope.map((item, index) =>
              item.responsibility === "Truwater" ? (
                <Input
                  key={index}
                  aria-label={`Truwater scope item ${index + 1}`}
                  value={item.description}
                  onChange={(event) => setScopeField(index, "description", event.target.value)}
                />
              ) : null
            )}
          </div>
        </CardContent>
      </Card>
      {/* Optional items (A spare parts, B supervision rates) are standard: printed from the defaults, not edited here. */}

      {/* Purchaser responsibilities and the delivery schedule chart are standard: printed from the defaults. */}
      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle>Delivery</CardTitle>
          <CardDescription>Printed as “Delivery Time - …” under the delivery schedule.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5 sm:max-w-sm">
          <Label htmlFor="commercial-delivery-time">Delivery Time</Label>
          <Input
            id="commercial-delivery-time"
            placeholder="e.g. 14- 16 Weeks"
            value={data.commercial.deliveryTime}
            onChange={(event) => updateCommercialField("deliveryTime", event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commercial Terms</CardTitle>
          <CardDescription>Price basis. The other terms of condition are standard and printed as they are.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <div className="grid content-start gap-1.5">
              <Label htmlFor="commercial-delivery-site">Price Basis – Delivered To Site At</Label>
              <Input
                id="commercial-delivery-site"
                placeholder={data.projectAddress || "e.g. Arthur Gorrie Correctional Centre, 3068 Ipswich Rd, Wacol QLD 4076"}
                value={data.commercial.deliverySite}
                onChange={(event) => updateCommercialField("deliverySite", event.target.value)}
              />
            </div>
            <div className="grid content-start gap-1.5">
              <Label htmlFor="commercial-containers">No. Of Containers</Label>
              <Input
                id="commercial-containers"
                type="number"
                min="1"
                step="1"
                value={data.commercial.containers}
                onChange={(event) => updateCommercialField("containers", event.target.value)}
              />
            </div>
            <p className="text-muted-foreground text-xs sm:col-span-2">
              Blank site = the project address. The port follows tower 1&apos;s C&amp;F port (
              {towers[0]?.port || "…"}).
            </p>
          </div>
          {/* The other terms (inclusions, exclusions, validity, payment, warranty, liability) are standard. */}
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