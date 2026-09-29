"use client";

import type { HistoryEntry, HistoryKind } from "@/lib/history";
import type { ProposalData } from "@/lib/proposal";

const PASSWORD_KEY = "truwater-history-password";

/** The History password for this browser session (asked once, forgotten when the tab closes). */
export function getSavedPassword(): string | null {
  try {
    return sessionStorage.getItem(PASSWORD_KEY);
  } catch {
    return null;
  }
}

export function savePassword(password: string | null) {
  try {
    if (password) sessionStorage.setItem(PASSWORD_KEY, password);
    else sessionStorage.removeItem(PASSWORD_KEY);
  } catch {
    // Storage unavailable (e.g. private mode): the password is simply asked again next time.
  }
}

export class WrongPasswordError extends Error {}

async function call<T>(path: string, password: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", "x-history-password": password, ...init.headers },
  });
  if (response.status === 401) {
    savePassword(null);
    throw new WrongPasswordError("Wrong password.");
  }
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Something went wrong.");
  return response.json() as Promise<T>;
}

export const historyApi = {
  list: (kind: HistoryKind, password: string) =>
    call<{ entries: HistoryEntry[] }>(`/api/history?kind=${kind}`, password).then((r) => r.entries),
  save: (kind: HistoryKind, data: ProposalData, password: string) =>
    call<{ entry: HistoryEntry }>("/api/history", password, {
      method: "POST",
      body: JSON.stringify({ kind, data }),
    }).then((r) => r.entry),
  load: (kind: HistoryKind, id: string, password: string) =>
    call<Partial<ProposalData>>(`/api/history/${kind}/${id}`, password),
  remove: (kind: HistoryKind, id: string, password: string) =>
    call<{ ok: true }>(`/api/history/${kind}/${id}`, password, { method: "DELETE" }),
};
