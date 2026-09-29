"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Loader2, Lock, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HISTORY_KINDS, LOAD_KEY, type HistoryEntry, type HistoryKind } from "@/lib/history";
import { getSavedPassword, historyApi, savePassword, WrongPasswordError } from "@/lib/history-client";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" });

export function HistoryBrowser() {
  const router = useRouter();
  const [password, setPassword] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [kind, setKind] = useState<HistoryKind>("rfq");
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPassword(getSavedPassword()), []);

  const refresh = useCallback(async (pw: string, tab: HistoryKind) => {
    setEntries(null);
    setError(null);
    try {
      setEntries(await historyApi.list(tab, pw));
    } catch (err) {
      if (err instanceof WrongPasswordError) setPassword(null);
      setError(err instanceof Error ? err.message : "Could not load History.");
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    if (password) void refresh(password, kind);
  }, [password, kind, refresh]);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    setBusy("unlock");
    setError(null);
    try {
      await historyApi.list("rfq", typed);
      savePassword(typed);
      setPassword(typed);
      setTyped("");
    } catch (err) {
      setError(err instanceof WrongPasswordError ? "Wrong password." : "Could not reach History.");
    } finally {
      setBusy(null);
    }
  }

  async function load(entry: HistoryEntry) {
    if (!password) return;
    setBusy(entry.id);
    try {
      const data = await historyApi.load(entry.kind, entry.id, password);
      sessionStorage.setItem(LOAD_KEY, JSON.stringify({ kind: entry.kind, data }));
      router.push("/documents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load that entry.");
      setBusy(null);
    }
  }

  async function remove(entry: HistoryEntry) {
    if (!password || !window.confirm(`Delete "${entry.title}"? This can't be undone.`)) return;
    setBusy(entry.id);
    try {
      await historyApi.remove(entry.kind, entry.id, password);
      setEntries((prev) => prev?.filter((e) => e.id !== entry.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that entry.");
    } finally {
      setBusy(null);
    }
  }

  if (!password) {
    return (
      <Card className="max-w-md">
        <CardContent>
          <form onSubmit={unlock} className="grid gap-3">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="size-4" /> History is password protected
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="history-password">Password</Label>
              <Input
                id="history-password"
                type="password"
                autoComplete="current-password"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={!typed || busy === "unlock"}>
              {busy === "unlock" && <Loader2 className="animate-spin" />} Open History
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <div role="tablist" aria-label="Document type" className="bg-muted inline-flex w-fit gap-1 rounded-lg p-1">
        {HISTORY_KINDS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={kind === tab.id}
            onClick={() => setKind(tab.id)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              kind === tab.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card className="py-2">
        <CardContent className="px-0">
          {entries === null ? (
            <p className="text-muted-foreground flex items-center gap-2 px-6 py-6 text-sm">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground px-6 py-6 text-sm">
              Nothing saved here yet. Use “Save” on the Documents page to keep a{" "}
              {HISTORY_KINDS.find((t) => t.id === kind)?.label}.
            </p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{entry.title}</p>
                    <p className="text-muted-foreground text-xs">Saved {dateFormat.format(new Date(entry.savedAt))}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => load(entry)} disabled={busy !== null}>
                      {busy === entry.id ? <Loader2 className="animate-spin" /> : <FolderOpen />} Load
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${entry.title}`}
                      onClick={() => remove(entry)}
                      disabled={busy !== null}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
