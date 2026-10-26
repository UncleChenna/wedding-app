import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";
import { scanA11y } from "./support/axe";

for (const theme of listThemes()) {
  for (const width of [375, 768, 1280]) {
    test(`RSVP preview @smoke ${theme.id} ${width}: complete and alternate journeys`, async ({
      page,
    }, info) => {
      // One complete journey includes multiple axe scans and state screenshots.
      test.setTimeout(90_000);
      const mutations: string[] = [];
      page.on("request", (request) => {
        if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()))
          mutations.push(request.url());
      });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/dev");
      await page.getByRole("link", { name: "RSVP preview", exact: true }).click();
      await page.getByLabel("Preview theme").selectOption(theme.id);

      async function check(state: string) {
        await page.evaluate(() => document.fonts.ready);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        for (const role of ["button", "combobox", "textbox", "link"] as const) {
          for (const target of await page.getByRole(role).all()) {
            const box = await target.boundingBox();
            expect(box?.height).toBeGreaterThanOrEqual(44);
            expect(box?.width).toBeGreaterThanOrEqual(44);
          }
        }
        if (info.project.name === "desktop")
          await page.screenshot({
            path: `artifacts/rsvp/${theme.id}-${width}-${state}.png`,
            fullPage: true,
          });
      }

      await check("attendance");
      await page.getByRole("button", { name: "Continue", exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByText("Please tell us whether you can join us.")).toBeVisible();
      await expect(page.getByRole("radio", { name: "Count me in" })).toBeFocused();
      await check("attendance-error");
      await page.getByRole("radio", { name: "Count me in" }).check();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      await expect(
        page.getByText("Just you so far. You can continue without adding anyone."),
      ).toBeVisible();
      await page.getByLabel("Your name", { exact: true }).fill("");
      await page.getByRole("button", { name: "Review your reply" }).click();
      await expect(page.getByLabel("Your name", { exact: true })).toBeFocused();
      await expect(page.getByText("Please enter a name.")).toBeVisible();
      await expect(page.getByText("Please choose a meal.")).toBeVisible();
      await check("party-errors");
      await page.getByLabel("Your name", { exact: true }).fill("Alex Taylor");
      await page.getByLabel("Meal choice", { exact: true }).selectOption("chicken");
      await page.getByRole("button", { name: "Add a companion" }).click();
      await expect(page.getByLabel("Companion 1 name")).toBeFocused();
      await page.getByRole("button", { name: "Review your reply" }).click();
      await expect(page.getByLabel("Companion 1 name")).toHaveAttribute("aria-invalid", "true");
      await page.getByLabel("Companion 1 name").fill("Sam Taylor");
      await page.getByLabel("Meal choice", { exact: true }).nth(1).selectOption("fish");
      await page.getByRole("button", { name: "Add a companion" }).click();
      await page.getByLabel("Companion 2 name").fill("Jordan Taylor");
      await page.getByLabel("Meal choice", { exact: true }).nth(2).selectOption("vegetarian");
      await expect(page.getByRole("button", { name: "Add a companion" })).toBeDisabled();
      await check("party-full");
      await page.getByRole("button", { name: "Remove companion 1" }).click();
      await expect(page.getByRole("button", { name: "Add a companion" })).toBeFocused();
      await expect(page.getByLabel("Companion 1 name")).toHaveValue("Jordan Taylor");
      await expect(page.getByLabel("Meal choice", { exact: true }).nth(1)).toHaveValue(
        "vegetarian",
      );
      const otherTheme = listThemes().find((item) => item.id !== theme.id);
      if (!otherTheme) throw new Error("The RSVP review needs two themes");
      await page.getByLabel("Preview theme").selectOption(otherTheme.id);
      await expect(page.getByLabel("Companion 1 name")).toHaveValue("Jordan Taylor");
      await page.getByLabel("Preview theme").selectOption(theme.id);
      await page.getByRole("button", { name: "Review your reply" }).click();
      await expect(page.getByRole("list", { name: "Party and meals" })).toContainText(
        "Jordan Taylor",
      );
      await check("review");
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("Alex Taylor");
      await page.getByLabel("Your name", { exact: true }).fill("A".repeat(80));
      await page.getByRole("button", { name: "Review your reply" }).click();
      await check("long-name");
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await page.getByLabel("Your name", { exact: true }).fill("Alex Taylor");
      await page.getByRole("button", { name: "Review your reply" }).click();
      await page.getByRole("button", { name: "Preview confirmation" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "You're in. We're already saving you a dance.",
      );
      await expect(page.getByText(/No RSVP has been sent/)).toBeVisible();
      await check("accepted");
      await page.getByRole("button", { name: "Start again" }).click();
      await expect(page.getByRole("radio", { name: "Count me in" })).not.toBeChecked();
      await page.getByRole("radio", { name: "I'll be there in spirit" }).check();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(page.getByRole("list", { name: "Party and meals" })).toHaveCount(0);
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await expect(page.getByRole("radio", { name: "I'll be there in spirit" })).toBeChecked();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await check("decline-review");
      await page.getByRole("button", { name: "Preview confirmation" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "We'll miss you, and we'll raise a glass in your name.",
      );
      await check("declined");
      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Will you join us?");
      expect(mutations).toEqual([]);
    });
  }
}

test("@smoke cancelled transitions still run the accessibility scan", async ({ page }) => {
  await page.goto("/dev/rsvp");
  await page.evaluate(() => {
    const invalidButton = document.createElement("button");
    document.body.append(invalidButton);
    const animation = document.body.animate([{ opacity: 0.9 }, { opacity: 1 }], { duration: 1000 });
    setTimeout(() => animation.cancel(), 300);
  });
  expect(await scanA11y(page)).toContainEqual(expect.stringContaining("button-name"));
});
