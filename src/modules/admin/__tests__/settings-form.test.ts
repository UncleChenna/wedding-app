import { describe, expect, it } from "vitest";
import { defaultEventSettings, type EventSettings } from "@/modules/shared/lib/event-settings";
import { parseSettingsForm, utcToZonedLocal, zonedLocalToUtc } from "../lib/settings-form";

const current = { ...defaultEventSettings, coupleNames: ["Uchenna", "Adaora"] } as EventSettings;
const complete = {
  partnerOne: " Uchenna ",
  partnerTwo: "Adaora",
  eventDate: "2026-12-19",
  ceremonyTime: "14:30",
  timeZone: "Africa/Lagos",
  venue: "The Garden Hall",
  mapUrl: "https://maps.example.com/garden",
  dressCode: "Black tie",
  rsvpLockAt: "2026-12-12T18:00",
  invitationVoice: "warm",
  defaultMaxTagAlongs: "1",
  retentionDays: "90",
  maxOpenOrdersPerTable: "3",
  orderCooldownSeconds: "60",
  maxItemQuantity: "10",
};
function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("venue time conversion", () => {
  it("reads a cutoff as wall-clock time at the venue, across daylight saving", () => {
    expect(zonedLocalToUtc("2026-12-18T23:00", "Africa/Lagos")?.toISOString()).toBe(
      "2026-12-18T22:00:00.000Z",
    );
    expect(zonedLocalToUtc("2026-07-01T09:00", "Europe/London")?.toISOString()).toBe(
      "2026-07-01T08:00:00.000Z",
    );
    expect(zonedLocalToUtc("2026-12-01T09:00", "Europe/London")?.toISOString()).toBe(
      "2026-12-01T09:00:00.000Z",
    );
    expect(utcToZonedLocal(new Date("2026-12-18T22:00:00Z"), "Africa/Lagos")).toBe(
      "2026-12-18T23:00",
    );
    expect(zonedLocalToUtc("not a date", "Africa/Lagos")).toBeNull();
  });
});

describe("event settings form", () => {
  it("accepts complete details and keeps the controls it doesn't edit", () => {
    const parsed = parseSettingsForm(form(complete), { ...current, orderingOpen: true });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toMatchObject({
      coupleNames: ["Uchenna", "Adaora"],
      timeZone: "Africa/Lagos",
      ceremonyTime: "14:30",
      orderCooldownSeconds: 60,
      orderingOpen: true,
      activeThemeId: current.activeThemeId,
    });
    expect(parsed.value.rsvpLockAt?.toISOString()).toBe("2026-12-12T17:00:00.000Z");
  });

  it("keeps undecided details blank instead of inventing a default time zone", () => {
    const parsed = parseSettingsForm(
      form({
        ...complete,
        timeZone: "",
        venue: "",
        mapUrl: "",
        dressCode: "",
        ceremonyTime: "",
        rsvpLockAt: "",
      }),
      current,
    );
    expect(parsed.ok && parsed.value).toMatchObject({
      timeZone: null,
      venue: null,
      mapUrl: null,
      dressCode: null,
      ceremonyTime: null,
      rsvpLockAt: null,
    });
  });

  it("rejects an RSVP cutoff after the wedding has begun", () => {
    const parsed = parseSettingsForm(
      form({ ...complete, rsvpLockAt: "2026-12-19T09:00" }),
      current,
    );
    expect(parsed).toEqual({
      ok: false,
      fields: {
        rsvpLockAt: "Choose a cutoff before the wedding day. Replies lock on the day anyway.",
      },
    });
  });

  it("requires a real venue time zone before an RSVP cutoff", () => {
    const parsed = parseSettingsForm(form({ ...complete, timeZone: "" }), current);
    expect(parsed.ok === false && parsed.fields.rsvpLockAt).toBe(
      "Set the venue time zone before choosing an RSVP cutoff.",
    );
  });

  it.each([
    [
      "timeZone",
      { timeZone: "Mars/Olympus" },
      "Use a time zone such as Africa/Lagos or Europe/London.",
    ],
    ["partnerOne", { partnerOne: "  " }, "Enter both names."],
    ["eventDate", { eventDate: "2026-02-30" }, "Choose the wedding date."],
    [
      "mapUrl",
      { mapUrl: "http://maps.example.com" },
      "Use a full map link starting with https://.",
    ],
    ["orderCooldownSeconds", { orderCooldownSeconds: "-1" }, "Use between 0 and 86400 seconds."],
    [
      "maxOpenOrdersPerTable",
      { maxOpenOrdersPerTable: "" },
      "Allow between 1 and 100 open orders per table.",
    ],
    ["invitationVoice", { invitationVoice: "shouty" }, "Choose Warm, Playful or Formal."],
  ] as const)("reports %s problems in plain words", (field, override, message) => {
    const parsed = parseSettingsForm(form({ ...complete, ...override }), current);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.fields[field]).toBe(message);
  });
});
