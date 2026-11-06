import { expect, it } from "vitest";
import { evaluateEventClosure } from "../lib/event-closure";

const settings = { eventDate: "2026-12-19", timeZone: "Europe/London" };
const confirmed = {
  confirmation: "CLOSE EVENT",
  eventDate: settings.eventDate,
  evidencePreserved: true,
};
const after = new Date("2026-12-20T06:00:00Z");
it("permits explicitly confirmed closure at the existing staff cutoff", () => {
  expect(evaluateEventClosure(confirmed, settings, after)).toEqual({
    status: "allowed",
    cutoff: after,
  });
});
it("blocks premature closure, including one millisecond before cutoff", () => {
  expect(evaluateEventClosure(confirmed, settings, new Date(after.getTime() - 1)).status).toBe(
    "too-early",
  );
});
it.each([null, "", "Not/AZone"])("blocks unknown venue timezone %s", (timeZone) => {
  expect(evaluateEventClosure(confirmed, { ...settings, timeZone }, after).status).toBe(
    "settings-required",
  );
});
it.each([
  { ...confirmed, confirmation: "close event" },
  { ...confirmed, evidencePreserved: false },
  { ...confirmed, evidencePreserved: "true" },
  {},
])("requires deliberate closure and evidence confirmation", (input) => {
  expect(evaluateEventClosure(input, settings, after).status).toBe("confirmation-required");
});
it("requires fresh confirmation if the event date changed", () => {
  expect(
    evaluateEventClosure(confirmed, { ...settings, eventDate: "2026-12-18" }, after).status,
  ).toBe("event-changed");
});
it("uses the venue timezone rather than the server timezone", () => {
  const local = { ...settings, timeZone: "Africa/Lagos" };
  expect(evaluateEventClosure(confirmed, local, new Date("2026-12-20T05:00:00Z")).status).toBe(
    "allowed",
  );
  expect(evaluateEventClosure(confirmed, local, new Date("2026-12-20T04:59:59Z")).status).toBe(
    "too-early",
  );
});
it("fails closed for an invalid clock", () => {
  expect(evaluateEventClosure(confirmed, settings, new Date("invalid")).status).toBe(
    "settings-required",
  );
});
