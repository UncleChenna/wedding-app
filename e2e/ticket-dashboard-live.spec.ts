import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { startDashboard } from "../scripts/tickets/dashboard-server";
import { effective, loadTickets } from "../scripts/tickets/store";

test("@smoke live dashboard preserves filters and details through updates and reconnects", async ({
  page,
}, info) => {
  let tickets = effective(loadTickets(process.cwd()), null);
  let disconnected = false;
  const app = await startDashboard({
    cwd: process.cwd(),
    port: 0,
    intervalMs: 60000,
    watchFiles: false,
    load: async () => {
      if (disconnected) throw new Error("simulated failure");
      return {
        tickets,
        source: "Shared ledger",
        base: "test",
        generated: new Date().toISOString(),
        connected: true,
      };
    },
  });
  try {
    await page.goto(app.url);
    await expect(page.locator("#freshness")).toContainText("Connected");
    await page.getByLabel("Find a ticket").fill("TICKET-190");
    await page.getByLabel("Appearance").selectOption("midnight-champagne");
    await page.getByRole("combobox", { name: "Priority", exact: true }).selectOption("high");
    await expect(page.locator(".card")).toHaveCount(1);
    await page.locator(".card").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    tickets = tickets.map((ticket) =>
      ticket.meta.id === "TICKET-190"
        ? {
            ...ticket,
            meta: {
              ...ticket.meta,
              owner: "collaborator",
              title: "Refresh board with a collaborator",
              status: "in_review" as const,
            },
          }
        : ticket,
    );
    await app.refresh();
    await expect(page.getByRole("dialog")).toContainText("collaborator");
    await expect(page.locator("#detail-title")).toHaveText("Refresh board with a collaborator");
    await expect(page.getByLabel("Find a ticket")).toHaveValue("TICKET-190");
    await expect(page.getByLabel("Appearance")).toHaveValue("midnight-champagne");
    await expect(page.getByRole("combobox", { name: "Priority", exact: true })).toHaveValue("high");
    await page.keyboard.press("Escape");
    await expect(page.locator(".card")).toBeFocused();
    disconnected = true;
    await app.refresh();
    await expect(page.locator("#freshness")).toContainText("Offline / stale");
    await expect(page.locator("#freshness")).toContainText("Last successful refresh");
    await expect(page.locator(".card")).toHaveCount(1);
    disconnected = false;
    await app.refresh();
    await expect(page.locator("#freshness")).toContainText("Connected");
    mkdirSync("artifacts/tickets/live-screenshots", { recursive: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of ["ivory-gold", "midnight-champagne"]) {
      await page.getByLabel("Appearance").selectOption(theme);
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.screenshot({
          path: `artifacts/tickets/live-screenshots/${theme}-${width}-${info.project.name}.png`,
          fullPage: true,
        });
      }
    }
    // Losing the local HTTP connection must retain the rendered board and retry automatically.
    await page.route("**/api/board", (route) => route.abort());
    await expect(page.locator("#freshness")).toContainText("Disconnected from local server");
    await expect(page.locator(".card")).toHaveCount(1);
    await page.unroute("**/api/board");
    await expect(page.locator("#freshness")).toContainText("Connected");
  } finally {
    await app.close();
  }
});
