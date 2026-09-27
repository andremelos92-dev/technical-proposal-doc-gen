import Link from "next/link";
import { ArrowRight, FileSpreadsheet, FileText, History } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_ACTIONS = [
  {
    title: "RFQ",
    description: "Quotation Project Summary for the engineers: project details and tower specification.",
    icon: FileSpreadsheet,
  },
  {
    title: "Technical Proposal",
    description: "Cover page addressed to the customer or a regional partner, with revision table.",
    icon: FileText,
  },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Truwater Document Generator. Start a new document or pick up a previous one.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {QUICK_ACTIONS.map(({ title, description, icon: Icon }) => (
          <Link key={title} href="/documents" className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:shadow-md">
              <CardHeader className="grid-cols-[auto_1fr] items-center gap-x-4">
                <div className="bg-primary/10 text-primary row-span-2 flex size-11 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <CardTitle>New {title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
                  Open form
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="mt-6">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Documents</CardTitle>
          <Link href="/history" className="text-primary text-sm font-medium hover:underline">
            View history
          </Link>
        </CardHeader>
        <CardContent className="grid justify-items-center gap-2 py-6 text-center">
          <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
            <History className="size-5" />
          </div>
          <p className="font-medium">No recent documents</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Documents you generate will appear here once document history is available.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
