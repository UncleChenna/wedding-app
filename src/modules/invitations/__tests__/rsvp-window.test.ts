import { afterEach, describe, expect, it, vi } from "vitest";
import { rsvpWindow } from "../lib/rsvp-window";
const settings = { eventDate: "2026-12-19", timeZone: "Africa/Lagos", rsvpLockAt: null };
afterEach(() => vi.useRealTimers());
describe("RSVP edit window", () => {
  it.each([
    ["2026-12-18T22:59:59.999Z", "open"],
    ["2026-12-18T23:00:00.000Z", "locked"],
    ["2026-12-18T23:00:00.001Z", "locked"],
  ])("uses venue midnight at %s", (instant, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(instant));
    expect(rsvpWindow(settings)).toBe(expected);
  });
  it.each([
    ["2026-03-08", "America/New_York", "2026-03-08T04:59:59.999Z", "open"],
    ["2026-03-08", "America/New_York", "2026-03-08T05:00:00.000Z", "locked"],
    ["2026-11-01", "America/New_York", "2026-11-01T03:59:59.999Z", "open"],
    ["2026-11-01", "America/New_York", "2026-11-01T04:00:00.000Z", "locked"],
  ])("handles daylight-saving boundary dates", (eventDate, timeZone, instant, expected) => {
    expect(rsvpWindow({ ...settings, eventDate, timeZone }, new Date(instant))).toBe(expected);
  });
  it("honours a configured cutoff without extending wedding-day editing", () => {
    const explicit = { ...settings, rsvpLockAt: new Date("2026-12-18T20:00:00Z") };
    expect(rsvpWindow(explicit, new Date("2026-12-18T19:59:59.999Z"))).toBe("open");
    expect(rsvpWindow(explicit, new Date("2026-12-18T20:00:00Z"))).toBe("locked");
    expect(
      rsvpWindow(
        { ...settings, rsvpLockAt: new Date("2026-12-20T00:00:00Z") },
        new Date("2026-12-18T23:00:00Z"),
      ),
    ).toBe("locked");
  });
  it.each([null, "", "Not/AZone"])("rejects missing or invalid zone %s", (timeZone) => {
    expect(rsvpWindow({ ...settings, timeZone }, new Date("2026-12-18T12:00:00Z"))).toBe(
      "not-open",
    );
  });
  it("fails closed for invalid dates", () => {
    expect(rsvpWindow({ ...settings, eventDate: "2026-02-30" })).toBe("not-open");
    expect(rsvpWindow({ ...settings, rsvpLockAt: new Date("bad") })).toBe("not-open");
    expect(rsvpWindow(settings, new Date("bad"))).toBe("not-open");
  });
});
