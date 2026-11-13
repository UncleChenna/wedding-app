import { runInNewContext } from "node:vm";
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
    expiresAt: new Date("2027-03-19T00:00:00Z"),
    refreshedAt: new Date("2026-11-02T20:00:00Z"),
  });
  const html = await response.text();
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("x-wedding-offline-pass")).toBe("1");
  expect(response.headers.get("x-wedding-offline-expires")).toBe("2027-03-19T00:00:00.000Z");
  expect(html).toContain("2026-11-02T20:00:00.000Z");
  expect(html).toContain("offline copy");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>alert");
  expect(html).not.toContain("<form");
  expect(html).not.toContain("dietary");
  expect(html).toContain("svg");
});

async function refreshFixture() {
  const html = await offlinePassResponse({
    pass: { names: ["Synthetic guest"], householdName: null, partySize: 1, tableNumber: null },
    url: "https://example.com/p/synthetic",
    themes: getActiveThemes(),
    tokenVersion: 1,
    expiresAt: new Date("2099-12-19T00:00:00Z"),
  }).text();
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
  if (!script) throw new Error("Expected the actual native pass script");
  const window = new EventTarget(),
    button = new EventTarget();
  const navigator = { onLine: false };
  let reloads = 0;
  runInNewContext(script, {
    window,
    navigator,
    location: {
      reload: () => {
        reloads++;
      },
    },
    document: { getElementById: (id: string) => (id === "refresh" ? button : { textContent: "" }) },
  });
  return { window, button, navigator, reloads: () => reloads };
}

it("ignores stale online events while offline and refreshes a genuine active reconnect", async () => {
  const f = await refreshFixture();
  f.window.dispatchEvent(new Event("online"));
  expect(f.reloads()).toBe(0);
  f.navigator.onLine = true;
  f.window.dispatchEvent(new Event("online"));
  expect(f.reloads()).toBe(1);
});

it("does not reopen a departed pass and restores reconnect handling on pageshow", async () => {
  const f = await refreshFixture();
  f.navigator.onLine = true;
  f.window.dispatchEvent(new Event("pagehide"));
  f.window.dispatchEvent(new Event("online"));
  expect(f.reloads()).toBe(0);
  f.window.dispatchEvent(new Event("pageshow"));
  f.window.dispatchEvent(new Event("online"));
  expect(f.reloads()).toBe(1);
});

it("keeps explicit Refresh available while offline", async () => {
  const f = await refreshFixture();
  f.button.dispatchEvent(new Event("click"));
  expect(f.reloads()).toBe(1);
});
