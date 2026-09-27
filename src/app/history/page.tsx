import type { Metadata } from "next";
import { Download, History, Search, Upload } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "History · Truwater Document Generator" };

const PLANNED = [
  { icon: Search, text: "Find any RFQ or Technical Proposal by quote number, project or customer" },
  { icon: Download, text: "Download a previous document again, exactly as it was generated" },
  { icon: Upload, text: "Upload older documents so all projects live in one place" },
];

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground mt-2">
          Previously generated and uploaded documents will appear here.
        </p>
      </header>

      <Card>
        <CardContent className="grid justify-items-center gap-6 py-6 text-center">
          <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
            <History className="size-6" />
          </div>
          <div className="grid gap-1">
            <p className="font-semibold">No documents yet</p>
            <p className="text-muted-foreground max-w-md text-sm">
              Document history is coming soon. Once it is ready, every document you generate will
              be saved here automatically.
            </p>
          </div>
          <ul className="grid w-full max-w-md gap-3 text-left text-sm">
            {PLANNED.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon className="text-primary mt-0.5 size-4 shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
