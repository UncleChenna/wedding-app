import { z } from "zod";
import type { GatePublicKey } from "./gate-token";

export interface GuestSnapshotRow {
  invitationId: string;
  tokenVersion: number;
  status: "draft" | "sent" | "rsvp_yes" | "rsvp_no" | "revoked";
  attending: boolean | null;
  partySize: number;
  admittedSoFar: number;
  name: string;
  names: string[];
  tableNumber: number | null;
}
export interface GuestSnapshot {
  version: 1;
  session: string;
  generatedAt: number;
  expiresAt: number;
  keys: GatePublicKey[];
  invitations: GuestSnapshotRow[];
}

/** Self-contained: the worker embeds this exact validator, never a more permissive copy. */
export function parseGuestSnapshot(input: unknown): GuestSnapshot | null {
  const record = (value: unknown): Record<string, unknown> | null =>
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  const exact = (value: Record<string, unknown>, fields: readonly string[]) =>
    Object.keys(value).length === fields.length &&
    Object.keys(value).every((key) => fields.includes(key));
  const integer = (value: unknown, min: number, max = 2_147_483_647): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
  const text = (value: unknown, max: number): value is string =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= max &&
    !/[\p{Cc}\p{Cf}]/u.test(value);
  const value = record(input);
  if (
    !value ||
    !exact(value, ["version", "session", "generatedAt", "expiresAt", "keys", "invitations"])
  )
    return null;
  if (
    value.version !== 1 ||
    typeof value.session !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.session)
  )
    return null;
  if (
    !integer(value.generatedAt, 1, Number.MAX_SAFE_INTEGER) ||
    !integer(value.expiresAt, value.generatedAt + 1, Number.MAX_SAFE_INTEGER)
  )
    return null;
  if (!Array.isArray(value.keys) || value.keys.length < 1 || value.keys.length > 16) return null;
  const keyIds = new Set<string>();
  for (const inputKey of value.keys) {
    const key = record(inputKey);
    if (
      !key ||
      !exact(key, ["kid", "alg", "spki"]) ||
      key.alg !== "Ed25519" ||
      typeof key.kid !== "string" ||
      !/^[a-z0-9-]{1,32}$/.test(key.kid) ||
      keyIds.has(key.kid) ||
      typeof key.spki !== "string" ||
      !/^MCowBQYDK2VwAyEA[A-Za-z0-9_-]{43}$/.test(key.spki)
    )
      return null;
    keyIds.add(key.kid);
  }
  if (!Array.isArray(value.invitations) || value.invitations.length > 10_000) return null;
  const ids = new Set<string>();
  let characters = 0;
  for (const inputRow of value.invitations) {
    const row = record(inputRow);
    if (
      !row ||
      !exact(row, [
        "invitationId",
        "tokenVersion",
        "status",
        "attending",
        "partySize",
        "admittedSoFar",
        "name",
        "names",
        "tableNumber",
      ])
    )
      return null;
    if (
      typeof row.invitationId !== "string" ||
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(row.invitationId) ||
      ids.has(row.invitationId.toLowerCase())
    )
      return null;
    ids.add(row.invitationId.toLowerCase());
    if (
      !integer(row.tokenVersion, 1) ||
      typeof row.status !== "string" ||
      !["draft", "sent", "rsvp_yes", "rsvp_no", "revoked"].includes(row.status) ||
      (row.attending !== null && typeof row.attending !== "boolean")
    )
      return null;
    if (
      !integer(row.partySize, 0) ||
      !integer(row.admittedSoFar, 0, row.partySize) ||
      (row.tableNumber !== null && !integer(row.tableNumber, 1))
    )
      return null;
    if (
      !text(row.name, 512) ||
      !Array.isArray(row.names) ||
      row.names.length > 1000 ||
      !row.names.every((name) => text(name, 200))
    )
      return null;
    characters +=
      row.name.length + row.names.reduce((sum: number, name: string) => sum + name.length, 0);
    if (characters > 500_000) return null;
  }
  return input as GuestSnapshot;
}

/** External server projection validation shares the worker's exact strict contract. */
export const guestSnapshotSchema = z.custom<GuestSnapshot>(
  (value) => parseGuestSnapshot(value) !== null,
);

/** TICKET-169: age is advisory; only the trusted session deadline is a hard expiry. */
export function guestSnapshotFreshness(snapshot: GuestSnapshot, now = Date.now()) {
  const age = Math.max(0, now - snapshot.generatedAt);
  return {
    ageMinutes: Math.floor(age / 60_000),
    refreshDue: age >= 5 * 60_000,
    stale: age >= 30 * 60_000,
    expired: !Number.isFinite(now) || snapshot.expiresAt <= now,
  };
}
