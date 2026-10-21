import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { dashboardHtml } from "../scripts/tickets/dashboard";
import { effective, loadTickets } from "../scripts/tickets/store";

const tickets = effective(loadTickets(process.cwd()), null);
const html = dashboardHtml(tickets, "Local test snapshot", "test-base");

test("@smoke ticket dashboard filters and keyboard details", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(html);
  await expect(page.locator(".card")).toHaveCount(tickets.length);
  await page.getByLabel("Find a ticket").fill("TICKET-189");
  await expect(page.locator(".card")).toHaveCount(1);
  const card = page.locator(".card");
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Acceptance criteria");
  await page.keyboard.press("Escape");
  await expect(card).toBeFocused();
  await page.getByLabel("Find a ticket").fill("no-such-ticket-xyz");
  await expect(page.locator("#empty")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("combobox", { name: "Label", exact: true }).selectOption("frontend");
  await expect(page.locator(".card")).toHaveCount(
    tickets.filter((t) => t.meta.labels.includes("frontend")).length,
  );
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".card")).toHaveCount(tickets.length);
  expect(errors).toEqual([]);
});

test("@smoke dashboard responsive themes and reduced motion", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(html);
  mkdirSync("artifacts/tickets/screenshots", { recursive: true });
  for (const theme of ["ivory-gold", "midnight-champagne"]) {
    await page.getByLabel("Appearance").selectOption(theme);
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page
          .locator("button, input, select")
          .evaluateAll((nodes) =>
            nodes
              .filter((n) => n.getClientRects().length)
              .every((n) => n.getBoundingClientRect().height >= 44),
          ),
      ).toBe(true);
      // A representative short list keeps evidence legible without hiding columns.
      await page.getByLabel("Find a ticket").fill("TICKET-189");
      await page.screenshot({
        path: `artifacts/tickets/screenshots/${theme}-${width}-${testInfo.project.name}.png`,
        fullPage: true,
      });
      await page.getByLabel("Find a ticket").fill("");
    }
  }
});
