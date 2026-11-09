import { expect, it } from "vitest";
import { historySnapshot, historyActor } from "../lib/rsvp-history-view";
it("projects only readable RSVP fields and strips contacts, credentials and internal identifiers", () => {
  const parsed = historySnapshot({
    status: "rsvp_yes",
    token: "secret",
    email: "private@example.test",
    rsvp: { attending: true, countAttending: 2, respondedAt: "2026-10-01T10:00:00Z" },
    people: [
      {
        id: "internal",
        name: "Ada",
        isPrimary: true,
        mealChoice: "Rice",
        dietaryNotes: "No nuts",
        phone: "secret",
      },
    ],
  });
  expect(parsed).toEqual({
    status: "rsvp_yes",
    rsvp: { attending: true, countAttending: 2 },
    people: [{ name: "Ada", isPrimary: true, mealChoice: "Rice", dietaryNotes: "No nuts" }],
  });
  expect(JSON.stringify(parsed)).not.toMatch(/secret|private|internal|respondedAt/);
});
it("retains missing or malformed history as unavailable without rendering raw JSON", () => {
  expect(historySnapshot(null)).toBeNull();
  expect(historySnapshot({ status: "secret", people: [], rsvp: null })).toBeNull();
  expect(
    historySnapshot({ status: "rsvp_yes", people: [], rsvp: { countAttending: -1 } }),
  ).toBeNull();
});
it("labels actors without exposing stored identifiers", () => {
  expect(historyActor("guest")).toBe("Guest");
  expect(historyActor("admin:private-id")).toBe("Admin");
  expect(historyActor("private@example.test")).toBe("Recorded update");
});

it("resolves stored meal UUIDs without inventing historical menu labels", () => {
  const meal = "00000000-0000-4000-8000-000000000002";
  const value = {
    status: "rsvp_yes",
    rsvp: null,
    people: [{ name: "Ada", isPrimary: true, mealChoice: meal, dietaryNotes: null }],
  };
  expect(historySnapshot(value, new Map([[meal, "Jollof rice"]]))?.people[0]?.mealChoice).toBe(
    "Jollof rice (current menu name)",
  );
  expect(historySnapshot(value)?.people[0]?.mealChoice).toBe(
    "Recorded meal; menu item unavailable",
  );
});
