import { z } from "zod";
import { eventSettingsSchema, type EventSettings } from "@/modules/shared/lib/event-settings";

/** Settings this form edits. The ordering switch and themes have their own controls. */
export type EditableSettings = Omit<
  EventSettings,
  "orderingOpen" | "activeThemeId" | "activeDarkThemeId"
>;
export const SETTINGS_FIELDS = [
  "partnerOne",
  "partnerTwo",
  "eventDate",
  "ceremonyTime",
  "timeZone",
  "venue",
  "mapUrl",
  "dressCode",
  "wifiName",
  "wifiPassword",
  "rsvpLockAt",
  "invitationVoice",
  "defaultMaxTagAlongs",
  "retentionDays",
  "maxOpenOrdersPerTable",
  "orderCooldownSeconds",
  "maxItemQuantity",
] as const;
export type SettingsField = (typeof SETTINGS_FIELDS)[number];

export type SettingsFormState =
  | { status: "idle" }
  | { status: "saved"; message: string }
  | {
      status: "error";
      message: string;
      fields?: Partial<Record<SettingsField, string>>;
      /** What the admin typed, so the form shows it again after React resets it. */
      values?: Partial<Record<SettingsField, string>>;
    };

/** Offset of `timeZone` from UTC at `instant`, in milliseconds. */
function zoneOffset(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** "2026-12-18T23:00" read as wall-clock time at the venue, as a real instant. */
export function zonedLocalToUtc(local: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const guess = Date.UTC(y ?? 0, (mo ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0);
  // Two passes settle the offset across daylight-saving changes.
  let instant = guess - zoneOffset(new Date(guess), timeZone);
  instant = guess - zoneOffset(new Date(instant), timeZone);
  const result = new Date(instant);
  return Number.isFinite(result.getTime()) ? result : null;
}

/** The inverse, for showing a stored cutoff in the form. */
export function utcToZonedLocal(instant: Date, timeZone: string): string {
  const shifted = new Date(instant.getTime() + zoneOffset(instant, timeZone));
  return shifted.toISOString().slice(0, 16);
}

const text = (value: FormDataEntryValue | null) =>
  typeof value === "string"
    ? value
        .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";
const optional = (value: string) => (value === "" ? null : value);

const messages: Partial<Record<string, string>> = {
  coupleNames: "Enter both names.",
  eventDate: "Choose the wedding date.",
  ceremonyTime: "Use a time like 14:30.",
  timeZone: "Use a time zone such as Africa/Lagos or Europe/London.",
  venue: "Keep the venue to 500 characters.",
  mapUrl: "Use a full map link starting with https://.",
  dressCode: "Keep the dress code to 500 characters.",
  wifiName: "Keep the Wi-Fi name to 32 characters.",
  wifiPassword: "Wi-Fi passwords are 8 to 63 characters.",
  invitationVoice: "Choose Warm, Playful or Formal.",
  defaultMaxTagAlongs: "Allow between 0 and 10 extra guests.",
  retentionDays: "Keep data for between 1 and 3650 days.",
  maxOpenOrdersPerTable: "Allow between 1 and 100 open orders per table.",
  orderCooldownSeconds: "Use between 0 and 86400 seconds.",
  maxItemQuantity: "Allow between 1 and 100 of one item.",
};
const fieldFor = (path: string): SettingsField =>
  path === "coupleNames" ? "partnerOne" : (path as SettingsField);

/**
 * Turns the admin form into validated settings. Unknown details stay empty (TBD) rather than
 * taking a development default; an RSVP cutoff needs a real venue time zone and must fall before
 * the wedding day, when replies lock anyway (TICKET-101).
 */
export function parseSettingsForm(
  form: FormData,
  current: EventSettings,
):
  | { ok: true; value: EventSettings }
  | { ok: false; fields: Partial<Record<SettingsField, string>> } {
  const fields: Partial<Record<SettingsField, string>> = {};
  const raw = Object.fromEntries(
    SETTINGS_FIELDS.map((name) => [name, text(form.get(name))]),
  ) as Record<SettingsField, string>;
  const timeZone = optional(raw.timeZone);
  let rsvpLockAt: Date | null = null;
  if (raw.rsvpLockAt) {
    if (!timeZone) fields.rsvpLockAt = "Set the venue time zone before choosing an RSVP cutoff.";
    else {
      try {
        rsvpLockAt = zonedLocalToUtc(raw.rsvpLockAt, timeZone);
      } catch {
        rsvpLockAt = null;
      }
      if (!rsvpLockAt) fields.rsvpLockAt = "Choose a date and time for the RSVP cutoff.";
    }
  }
  const number = (value: string) => (value === "" ? Number.NaN : Number(value));
  const candidate = {
    ...current,
    coupleNames: [raw.partnerOne, raw.partnerTwo],
    eventDate: raw.eventDate,
    ceremonyTime: optional(raw.ceremonyTime),
    timeZone,
    venue: optional(raw.venue),
    mapUrl: optional(raw.mapUrl),
    dressCode: optional(raw.dressCode),
    wifiName: optional(raw.wifiName),
    // A password's spaces are part of it, so it isn't trimmed; empty means none yet.
    wifiPassword: raw.wifiPassword === "" ? null : raw.wifiPassword,
    rsvpLockAt,
    invitationVoice: raw.invitationVoice,
    defaultMaxTagAlongs: number(raw.defaultMaxTagAlongs),
    retentionDays: number(raw.retentionDays),
    maxOpenOrdersPerTable: number(raw.maxOpenOrdersPerTable),
    orderCooldownSeconds: number(raw.orderCooldownSeconds),
    maxItemQuantity: number(raw.maxItemQuantity),
  };
  const parsed = eventSettingsSchema.safeParse(candidate);
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      const key = fieldFor(String(issue.path[0] ?? ""));
      if (!fields[key]) fields[key] = messages[String(issue.path[0])] ?? issue.message;
    }
  // Replies lock at midnight on the wedding day; a later cutoff would never apply.
  if (parsed.success && rsvpLockAt && timeZone) {
    const weddingDay = zonedLocalToUtc(`${parsed.data.eventDate}T00:00`, timeZone);
    if (weddingDay && rsvpLockAt.getTime() > weddingDay.getTime())
      fields.rsvpLockAt = "Choose a cutoff before the wedding day. Replies lock on the day anyway.";
  }
  if (Object.keys(fields).length || !parsed.success) return { ok: false, fields };
  return { ok: true, value: parsed.data };
}

export function submittedSettings(form: FormData): Partial<Record<SettingsField, string>> {
  return Object.fromEntries(
    SETTINGS_FIELDS.flatMap((name) => {
      const value = form.get(name);
      return typeof value === "string" ? [[name, value.slice(0, 600)]] : [];
    }),
  );
}

export const settingsCopy = {
  heading: "Event settings",
  intro:
    "The details guests see on their invitation, and how table ordering behaves. Leave anything undecided blank.",
  save: "Save settings",
  saving: "Saving…",
  saved: "Saved. Invitations and order limits use these now.",
  invalid: "Please check the highlighted fields.",
  failed: "We couldn't save the settings just now. Please try again.",
} as const;

export const voiceOptions = z.enum(["warm", "playful", "formal"]).options;
