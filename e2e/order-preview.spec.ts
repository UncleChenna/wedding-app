import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";
import { scanA11y } from "./support/axe";

for (const theme of listThemes())
  for (const width of [375, 768, 1280]) {
    test(`Ordering preview @smoke ${theme.id} ${width}`, async ({ page }, info) => {
      test.setTimeout(90_000);
      const mutations: string[] = [];
      page.on("request", (request) => {
        if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()))
          mutations.push(request.url());
      });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/dev");
      await page.getByRole("link", { name: "Table ordering preview", exact: true }).click();
      await page.getByLabel("Preview theme").selectOption(theme.id);
      async function check(state: string) {
        await page.evaluate(() => document.fonts.ready);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        for (const role of ["button", "combobox", "textbox", "spinbutton", "link"] as const)
          for (const target of await page.getByRole(role).all()) {
            const box = await target.boundingBox();
            expect(box?.height).toBeGreaterThanOrEqual(44);
            expect(box?.width).toBeGreaterThanOrEqual(44);
          }
        if (info.project.name === "desktop")
          await page.screenshot({
            path: `artifacts/ordering/${theme.id}-${width}-${state}.png`,
            fullPage: true,
          });
      }
      await check("table");
      await page.getByRole("button", { name: "Browse menu" }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByLabel("Table number")).toBeFocused();
      await page.getByLabel("Table number").fill("31");
      await page.getByRole("button", { name: "Browse menu" }).click();
      await expect(page.getByText("Enter a sample table number from 1 to 30.")).toBeVisible();
      await check("table-error");
      await page.getByLabel("Table number").fill("12");
      await page.getByRole("button", { name: "Browse menu" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      await expect(page.getByRole("button", { name: "Review order" })).toBeDisabled();
      await expect(page.getByText("Sold out in this sample menu")).toBeVisible();
      await expect(page.getByRole("spinbutton", { name: "Plantain quantity" })).toHaveCount(0);
      await check("empty-menu");
      const rice = page.getByRole("spinbutton", { name: "Jollof rice quantity" });
      await rice.fill("1.5");
      await rice.press("Tab");
      await page.getByRole("button", { name: "Review order" }).click();
      await expect(page.getByText("Use whole quantities.")).toBeVisible();
      await expect(rice).toBeFocused();
      await check("quantity-error");
      await rice.fill("2");
      await rice.press("Tab");
      await page.getByRole("button", { name: "Soft drinks", exact: true }).click();
      await expect(rice).toHaveCount(0);
      await page.getByRole("button", { name: "Increase Still water quantity" }).click();
      await page.getByRole("button", { name: "Alcoholic drinks", exact: true }).click();
      await page.getByRole("button", { name: "Increase Red wine quantity" }).click();
      await page.getByRole("button", { name: "All", exact: true }).click();
      await expect(rice).toHaveValue("2");
      await page
        .getByLabel("A note for the kitchen or bar")
        .fill("Please bring water without ice.");
      const other = listThemes().find((item) => item.id !== theme.id);
      if (!other) throw new Error("Two themes are required for ordering review");
      await page.getByLabel("Preview theme").selectOption(other.id);
      await expect(rice).toHaveValue("2");
      await page.getByLabel("Preview theme").selectOption(theme.id);
      await page.getByRole("button", { name: "Review order" }).click();
      await expect(page.getByRole("list", { name: "Order summary" })).toContainText("Jollof rice");
      await expect(
        page.getByRole("list", { name: "Order summary" }).getByRole("listitem"),
      ).toHaveCount(3);
      await expect(page.getByText("Please bring water without ice.")).toBeVisible();
      await check("review");
      await page.getByRole("button", { name: "Back to menu" }).click();
      await page.getByRole("button", { name: "Change table" }).click();
      await check("change-table");
      await page.getByLabel("Table number").fill("18");
      await page.getByRole("button", { name: "Browse menu" }).click();
      await expect(rice).toHaveValue("2");
      await page.getByRole("button", { name: "Review order" }).click();
      await page.getByRole("button", { name: "Preview order" }).click();
      await expect(page.getByText("Sample status: Received")).toBeVisible();
      await expect(page.getByText("Nothing has been sent to the kitchen or bar.")).toBeVisible();
      await check("received");
      await page.getByRole("button", { name: "Simulate service" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Enjoy every bite.");
      await expect(page.getByText("Sample status: Served")).toBeVisible();
      await check("served");
      await page.getByRole("button", { name: "Start another order" }).click();
      await expect(page.getByRole("button", { name: "Review order" })).toBeDisabled();
      await expect(page.getByLabel("A note for the kitchen or bar")).toHaveValue("");
      await expect(page.getByText("Table 18", { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByLabel("Table number")).toHaveValue("");
      expect(mutations).toEqual([]);
    });
  }
