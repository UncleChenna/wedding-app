import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { adminTestEmail, signInAdmin } from "./support/admin-session";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { themes } from "../src/modules/theming/themes";

test.describe("printable gate fallback", () => {
  test.skip(
    process.env.RUN_ADMIN_GATE_PRINT_TESTS !== "1",
    "Requires isolated local Auth/database and fresh allowlisted address",
  );
  test.setTimeout(180_000);
  let db: Sql;
  let id: string;
  const suffix = randomBytes(4).toString("hex");
  const names = Array.from(
    { length: 11 },
    (_, i) => `${i === 0 ? "Ada" : `Companion ${i}`} Chiamaka-Chinwendu ${"N".repeat(45)}${suffix}`,
  );
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(household_name,token,status,max_tag_alongs) values(${`Print household ${suffix}`},${randomUUID().replaceAll("-", "")},'rsvp_yes',10) returning id`;
    if (!row) throw new Error("Missing print fixture");
    id = row.id;
    await db`insert into rsvps(invitation_id,attending,count_attending) values(${id},true,11)`;
    for (const [index, name] of names.entries())
      await db`insert into guests(invitation_id,name,is_primary) values(${id},${name},${index === 0})`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (id) await db`update invitations set status='revoked' where id=${id}`;
    } finally {
      await db.end();
    }
  });
  test("authorized list includes all companions and produces unclipped monochrome A4 output", async ({
    page,
    request,
  }, info) => {
    const denied = await request.get("/admin/guests/print", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(denied.status());
    expect(await denied.text()).not.toContain(names[0]);
    await signInAdmin(
      page,
      request,
      adminTestEmail(info.project.name, process.env.ADMIN_GATE_PRINT_PREFIX ?? "gate-print"),
    );
    const response = await page.goto("/admin/guests/print");
    expect(response?.headers()["cache-control"]).toContain("no-store");
    const row = page.locator(`[data-print-invitation="${id}"]`);
    for (const name of names) await expect(row.getByText(name, { exact: true })).toBeVisible();
    const [expected] = await db<
      { count: number }[]
    >`select count(*)::integer as count from invitations where status='rsvp_yes'`;
    await expect(page.locator("[data-print-invitation]")).toHaveCount(expected?.count ?? -1);
    await mkdir(`docs/reviews/TICKET-069/${info.project.name}`, { recursive: true });
    await page.setViewportSize({ width: 375, height: 812 });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(
        await page.evaluate(() =>
          [...document.querySelectorAll("body *")]
            .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
            .map((element) => ({
              tag: element.tagName,
              class: element.className,
              right: element.getBoundingClientRect().right,
            })),
        ),
      ).toEqual([]);
      if (theme.id === "ivory-gold")
        await page.screenshot({ path: `docs/reviews/TICKET-069/${info.project.name}/screen.png` });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => {
      window.print = () => {
        document.body.dataset.printRequested = "yes";
      };
    });
    const printButton = page.getByRole("button", { name: "Print or save PDF" });
    await printButton.focus();
    await expect(printButton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("body")).toHaveAttribute("data-print-requested", "yes");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Back to guests" })).toBeFocused();
    for (const width of [375, 600, 768, 1280]) {
      await page.setViewportSize({ width, height: 812 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.setViewportSize({ width: 375, height: 812 });
    const firstTheme = themes[0];
    if (!firstTheme) throw new Error("No registered themes");
    await applyTheme(page, firstTheme);
    await page.locator("table").evaluate((table) => table.scrollIntoView());
    await page.screenshot({ path: `docs/reviews/TICKET-069/${info.project.name}/screen-rows.png` });
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("navigation", { name: "Admin" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Print or save PDF" })).not.toBeVisible();
    const geometry = await page.locator("th,td").evaluateAll((cells) =>
      cells.map((cell) => {
        const bounds = cell.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, color: getComputedStyle(cell).color };
      }),
    );
    expect(
      geometry.every(
        (cell) => cell.left >= 0 && cell.right <= 794 && cell.color === "rgb(0, 0, 0)",
      ),
    ).toBe(true);
    await page.pdf({
      path: `docs/reviews/TICKET-069/${info.project.name}/gate-list.pdf`,
      format: "A4",
      preferCSSPageSize: true,
      printBackground: true,
    });
    await writeFile(
      `docs/reviews/TICKET-069/${info.project.name}/expected-names.json`,
      JSON.stringify(names),
    );
  });
});
