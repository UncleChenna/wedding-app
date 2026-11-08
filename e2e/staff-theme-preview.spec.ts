import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";

test("staff form preview stays local and fits each theme", async ({ page, context }) => {
  test.setTimeout(60_000);
  await page.goto("/dev/theme");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of listThemes()) {
      const form = page
        .getByTestId(`theme-${theme.id}`)
        .getByRole("form", { name: "Staff sign-in" });
      await form.scrollIntoViewIfNeeded();
      await expect(form.getByLabel("Your six-digit PIN")).toBeVisible();
      await form.screenshot({ path: `docs/reviews/TICKET-031/preview/${theme.id}-${width}.png` });
    }
  }
  const form = page.getByTestId("theme-ivory-gold").getByRole("form", { name: "Staff sign-in" });
  await form.getByLabel("Your six-digit PIN").fill("012345");
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(form.getByText("Preview only. Use your station page to sign in.")).toBeVisible();
  expect((await context.cookies()).some((cookie) => cookie.name.startsWith("wedding-staff-"))).toBe(
    false,
  );
  await expect(page).toHaveURL(/\/dev\/theme$/);
});
