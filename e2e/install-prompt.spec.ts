import { expect, test, type Page } from "@playwright/test";

async function offer(page: Page, outcome: "accepted" | "dismissed" = "dismissed") {
  await expect
    .poll(() =>
      page.evaluate((choice) => {
        const event = new Event("beforeinstallprompt", { cancelable: true });
        Object.assign(event, {
          prompt: async () => {
            const root = document.documentElement;
            root.dataset.installCalls = String(Number(root.dataset.installCalls ?? "0") + 1);
          },
          userChoice: Promise.resolve({ outcome: choice }),
        });
        window.dispatchEvent(event);
        return event.defaultPrevented;
      }, outcome),
    )
    .toBe(true);
}

test("install waits for eligibility and interaction, then remembers dismissal on reload", async ({
  page,
}) => {
  await page.goto("/checkin");
  const install = page.getByRole("button", { name: "Install app", exact: true });
  await expect(install).toHaveCount(0);
  await offer(page);
  await expect(install).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(install).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-install-calls");
  await install.click();
  await expect(install).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-install-calls", "1");
  const expiry = await page.evaluate(() =>
    Number(localStorage.getItem("wedding-install-dismissed-until")),
  );
  expect(expiry).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
  await page.reload();
  await offer(page);
  await page.keyboard.press("Tab");
  await expect(install).toHaveCount(0);
});

test("Not now does not invoke the native prompt", async ({ page }) => {
  await page.goto("/kitchen");
  await offer(page);
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Not now", exact: true }).click();
  await expect(page.getByRole("button", { name: "Install app", exact: true })).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-install-calls");
});

test("installation elsewhere removes the offer", async ({ page }) => {
  await page.goto("/checkin");
  await offer(page, "accepted");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Install app", exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.getByRole("button", { name: "Install app", exact: true })).toHaveCount(0);
});
