import { expect, it } from "vitest";
import { offlinePassResponse } from "../server/offline-pass";
import { getActiveThemes } from "@/modules/theming/lib/registry";

it("renders a minimal escaped offline pass with a refresh timestamp and no RSVP actions", async () => {
  const response = offlinePassResponse({
    pass: {
      names: ['Ada <script>alert("x")</script>'],
      householdName: null,
      partySize: 2,
      tableNumber: 8,
    },
    url: "https://example.com/p/signed.read-only",
    themes: getActiveThemes(),
    tokenVersion: 1,
    refreshedAt: new Date("2026-11-02T20:00:00Z"),
  });
  const html = await response.text();
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("x-wedding-offline-pass")).toBe("1");
  expect(html).toContain("2026-11-02T20:00:00.000Z");
  expect(html).toContain("offline copy");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>alert");
  expect(html).not.toContain("<form");
  expect(html).not.toContain("dietary");
  expect(html).toContain("svg");
});
