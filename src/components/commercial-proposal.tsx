import {
  formatDate,
  projectTitle,
  proposalRecipient,
  referenceNumber,
  type ProposalData,
} from "@/lib/proposal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CommercialProposalProps = {
  data: ProposalData;
};

const equipment = [
  {
    equipment: "CT1 & CT2",
    model: "ECX 1212D2-3B",
    cells: "3 cells",
    flow: "507.8 m3/h / 141.05 L/s",
    motor: "3 x 11 kW (1 motor per cell)",
    price: 389449,
  },
  {
    equipment: "CT3",
    model: "ECX 1414F2-1B",
    cells: "1 cell",
    flow: "273.6 m3/h / 76.0 L/s",
    motor: "1 x 18.5 kW",
    price: 160590,
  },
] as const;

const scope = [
  ["SS316 frameworks, mechanical components and hardware", "Truwater"],
  ["SS316 cold water basin and supporting framework", "Truwater"],
  ["PP spray nozzles, PVC film fill and drift eliminators", "Truwater"],
  ["SS316 fan cylinders; aluminium alloy fan blades with galvanized steel hub", "Truwater"],
  ["Single-speed IP55 motors, 3 phase / 50 Hz / 400 V", "Truwater"],
  ["Recommended two-year operating spare parts", "Optional"],
  ["Erection and commissioning supervision and site erection work", "Optional"],
  ["Cabling, cable trays, lighting, instruments and controls", "Purchaser"],
  ["Concrete works, water treatment and external inlet piping", "Purchaser"],
] as const;

const schedule = [
  ["Receive and process purchase order", "1 week"],
  ["Engineering design approval", "1-2 weeks"],
  ["Procure bought-out materials", "1-2 weeks"],
  ["Manufacturing and production", "5-6 weeks"],
  ["Inspection and packing", "1 week"],
  ["Packing and logistics to FOB", "1 week"],
] as const;

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

export function CommercialProposal({ data }: CommercialProposalProps) {
  const title = projectTitle(data) || "Project name from Documents form";
  const total = equipment.reduce((sum, item) => sum + item.price, 0);
  const recipient = proposalRecipient(data) || "Customer from Documents form";

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6" role="tabpanel" aria-label="Commercial Proposal">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div className="min-w-0">
          <p className="text-primary text-xs font-semibold uppercase">Commercial Proposal Demo</p>
          <h2 className="mt-1 break-words text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-1">Cooling tower supply · Truwater Technologies Australia Pty Ltd</p>
        </div>
        <div className="border-l-2 border-primary pl-3 text-sm">
          <p className="font-semibold">DRAFT FOR REVIEW</p>
          <p className="text-muted-foreground">Sample pricing and terms</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
          <CardDescription>Project details are shared with the RFQ and Technical Proposal form.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Project" value={title} />
          <Detail label="Client" value={recipient} />
          <Detail label="Attention" value={data.contactName || "Contact from Documents form"} />
          <Detail label="Project address" value={data.projectAddress || "Project address from Documents form"} />
          <Detail label="TTA quote number" value={data.quoteNumber || "Quote number from Documents form"} />
          <Detail label="Reference number" value={referenceNumber(data) || "Generated from quote number and date"} />
          <Detail label="Proposal date" value={formatDate(data.date)} />
          <Detail label="Subject" value={title} />
        </CardContent>
      </Card>

      <section className="grid gap-4" aria-labelledby="pricing-heading">
        <div>
          <h3 id="pricing-heading" className="text-lg font-semibold">Pricing Schedule</h3>
          <p className="text-muted-foreground text-sm">Mechanical induced-draft counterflow cooling towers, SS316 construction.</p>
        </div>
        {equipment.map((item) => (
          <Card key={item.equipment} className="gap-0 overflow-hidden py-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/60 px-5 py-3">
              <h4 className="font-semibold">{item.equipment} · {item.model}</h4>
              <span className="text-sm font-semibold">{currency.format(item.price)}</span>
            </div>
            <CardContent className="grid gap-x-8 gap-y-3 py-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Cells" value={item.cells} />
              <Detail label="Arrangement" value="In-line" />
              <Detail label="Design flow rate" value={item.flow} />
              <Detail label="Water temperatures" value="35.0 °C in / 29.6 °C out" />
              <Detail label="Wet bulb temperature" value="26.8 °C" />
              <Detail label="Motor" value={item.motor} />
              <Detail label="Drive / fill" value="Belt & pulley · PVC film fill" />
              <Detail label="Construction" value="SS316 basin and support base" />
              <Detail label="Price basis" value="C&F Brisbane Port, containerized" />
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
          <CardDescription>Indicative responsibility split transcribed from the sample proposal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Description</th>
                  <th className="w-36 py-2 font-medium">Responsibility</th>
                </tr>
              </thead>
              <tbody>
                {scope.map(([description, responsibility]) => (
                  <tr key={description} className="border-b last:border-0">
                    <td className="py-2.5 pr-4">{description}</td>
                    <td className="py-2.5 font-medium">{responsibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optional Items and Services</CardTitle>
          <CardDescription>Options and rates shown for discussion; not included in the base lump sum unless noted.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-semibold">Included in base proposal</h4>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              <li>Construction and commissioning spares: 2 blocks of PVC infill, 2 blocks of drift eliminator, 5 spray nozzles</li>
              <li>Special tools: fan-blade inclinometer and glue machine</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Optional</h4>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              <li>Two-year operating spares: 3 blocks each of PVC infill and drift eliminator, 5 spray nozzles</li>
              <li>Erection or commissioning supervision: AUD 1,600 per man-day</li>
              <li>Overtime: AUD 300/hour Monday-Sunday; AUD 400/hour on public holidays</li>
            </ul>
            <p className="text-muted-foreground mt-2 text-sm">Travel, transport and accommodation are additional.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchaser Responsibilities</CardTitle>
          <CardDescription>Applies when Truwater or its supervisory services are engaged for tower erection.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
            <li>Provide an air-conditioned site office and work shed with power and water.</li>
            <li>Provide an approximately 25 m x 50 m lay-down area near the tower location.</li>
            <li>Keep utilities within 30 m of the work area; provide lighting for evening work if needed.</li>
            <li>Construct and check foundations, including dimensional checks, chipping and leveling.</li>
            <li>Provide site security and secure storage for mechanical and loose components.</li>
            <li>Provide sheltered, ventilated storage for PVC fill and drift eliminators.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Schedule</CardTitle>
          <CardDescription>Preliminary schedule: 14-16 weeks, subject to agreement of contractual requirements.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schedule.map(([step, duration], index) => (
              <li key={step} className="flex gap-3 border-l-2 border-primary/40 pl-3">
                <span className="text-primary text-xs font-bold">0{index + 1}</span>
                <div>
                  <p className="text-sm font-medium">{step}</p>
                  <p className="text-muted-foreground text-xs">{duration}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commercial Terms</CardTitle>
          <CardDescription>Sample terms from the supplied proposal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="Price basis" value="Delivered from Brisbane Port to Arthur Gorrie Correctional Centre in CKD form by flatbed container truck. Customs clearance and import duties included." />
          <Detail label="Exclusions" value="GST, container unloading, tower assembly and delivery to the work site are excluded." />
          <Detail label="Currency / validity" value="Australian dollars (AUD) · valid for 30 days from proposal date." />
          <Detail label="Payment" value="30% advance on purchase order confirmation; 70% on site delivery, payable 30 days from invoice." />
          <Detail label="Warranty" value="12 months from delivery against manufacturing defects, subject to installation, operation and maintenance recommendations." />
          <Detail label="Delivery risk" value="No liability for consequential, indirect or special damages, or delays caused by conditions beyond Truwater's control." />
        </CardContent>
      </Card>
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