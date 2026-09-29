import { createHash, timingSafeEqual } from "node:crypto";

/** True when the request carries the History password (set as HISTORY_PASSWORD on Vercel). */
export function isAuthorized(request: Request): boolean {
  const expected = process.env.HISTORY_PASSWORD;
  const given = request.headers.get("x-history-password");
  if (!expected || !given) return false;
  // Compare hashes so the check takes the same time whatever is typed.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function unauthorized() {
  return Response.json({ error: "Wrong or missing History password." }, { status: 401 });
}

/** Blob pathname for an entry. Ids are "<timestamp>_<base64url title>", so only safe characters. */
export function entryPath(kind: string, id: string): string {
  return `history/${kind}/${id}.json`;
}

export function isSafeId(id: string): boolean {
  return /^\d+_[A-Za-z0-9_-]*$/.test(id);
}

export function encodeTitle(title: string): string {
  return Buffer.from(title, "utf8").toString("base64url");
}

export function decodeTitle(encoded: string): string {
  try {
    return Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return "Untitled";
  }
}
