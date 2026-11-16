import { describe, expect, it, vi } from "vitest";
import { eventSettingsSchema, defaultEventSettings } from "../lib/event-settings";
import { readEventSettings } from "../server/read-event-settings";

describe("event settings", () => {
  it("returns the details printed on the invitation card as defaults", async () => {
    expect(await readEventSettings(async () => null)).toEqual(defaultEventSettings);
    expect(defaultEventSettings).toMatchObject({
      coupleNames: ["Uchenna", "Adaora"],
      eventDate: "2026-12-19",
      timeZone: "Africa/Lagos",
      venue: "St Paul's Anglican Church, Apo Resettlement, Abuja",
      ceremonyTime: "12:00",
      receptionTime: "14:30",
      receptionVenue:
        "Fineworld Recreational Park, Events & Gardens, opposite AYM Shafa fuel station, Apo Resettlement, Abuja",
      rsvpPhone: "09160665114",
      mapUrl: null,
      dressCode: null,
      // 23:59 on 17 December in Lagos (UTC+1).
      rsvpLockAt: new Date("2026-12-17T22:59:00.000Z"),
      orderingOpen: false,
      defaultMaxTagAlongs: 1,
      retentionDays: 90,
      activeThemeId: "ivory-gold",
    });
  });
  it("returns validated configured values", async () => {
    const configured = {
      ...defaultEventSettings,
      timeZone: "Africa/Lagos",
      venue: "Test venue",
      rsvpLockAt: new Date("2026-12-18T23:00:00Z"),
    };
    expect(await readEventSettings(async () => configured)).toEqual(configured);
  });
  it.each([
    { defaultMaxTagAlongs: 11 },
    { retentionDays: 0 },
    { maxOpenOrdersPerTable: 0 },
    { orderCooldownSeconds: -1 },
    { maxItemQuantity: 0 },
    { timeZone: "Mars/Olympus" },
    { mapUrl: "javascript:alert(1)" },
    { eventDate: "2026-02-30" },
    { ceremonyTime: "25:00" },
    { coupleNames: ["Only one"] },
    { rsvpLockAt: new Date("2026-12-19T00:00:00Z"), timeZone: null },
  ])("rejects invalid settings %j", (patch) => {
    expect(eventSettingsSchema.safeParse({ ...defaultEventSettings, ...patch }).success).toBe(
      false,
    );
  });
  it("does not hide corrupt settings or an outage behind defaults", async () => {
    await expect(
      readEventSettings(async () => ({ ...defaultEventSettings, retentionDays: -1 })),
    ).rejects.toThrow();
    const failure = new Error("database unavailable");
    await expect(readEventSettings(vi.fn().mockRejectedValue(failure))).rejects.toBe(failure);
  });
  it("returns fresh defaults", async () => {
    const first = await readEventSettings(async () => null);
    first.coupleNames[0] = "Changed";
    expect((await readEventSettings(async () => null)).coupleNames[0]).toBe("Uchenna");
  });
});
