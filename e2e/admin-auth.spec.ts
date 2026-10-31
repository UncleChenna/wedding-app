import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { z } from "zod";
import { listThemes } from "../src/modules/theming";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";

test("admin sign-in rejects unlisted addresses accessibly @smoke", async ({ page }) => {
  await page.goto("/admin/sign-in");
  await page.getByLabel("Email address").fill("not-invited@example.test");
  await page.getByRole("button", { name: "Send code", exact: true }).click();
  await expect(page.getByRole("status", { name: "Account status" })).toContainText(
    "isn’t on the wedding admin list",
  );
  await expect(page.getByRole("status", { name: "Account status" })).toBeFocused();
  await expect(page.getByLabel("Sign-in code")).toHaveCount(0);
  for (const theme of listThemes()) {
    await applyTheme(page, theme);
    expect(await scanA11y(page)).toEqual([]);
  }
});
for (const route of ["/admin/sign-in", "/admin/sign-out"]) {
  for (const theme of listThemes()) {
    test(`admin form ${route} ${theme.id} fits all widths with reduced motion @smoke`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(route);
      await applyTheme(page, theme);
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 812 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        for (const control of await page.locator("button, input:not([type=hidden])").all()) {
          const box = await control.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
        }
        expect(await scanA11y(page)).toEqual([]);
        expect(
          await page.locator("h1").evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
        ).toBeGreaterThanOrEqual(32);
      }
    });
  }
}
test("admin sign-in supports keyboard focus @smoke", async ({ page }) => {
  await page.goto("/admin/sign-in");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email address")).toBeFocused();
});

test("local email OTP creates only httpOnly session cookies and signs out", async ({
  page,
  request,
  context,
}, info) => {
  test.skip(process.env.RUN_ADMIN_AUTH_TESTS !== "1", "Explicit isolated Auth/mail-catcher opt-in");
  process.loadEnvFile(".env.local");
  const meta = z
    .object({ portBase: z.number(), path: z.string() })
    .parse(JSON.parse(readFileSync(".harness/worktree.json", "utf8")));
  expect(meta.path).toBe(process.cwd());
  const api = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  expect(api.hostname).toBe("127.0.0.1");
  expect(api.port).toBe(String(meta.portBase));
  const email = `admin-${info.project.name}@example.test`;
  expect((process.env.ADMIN_EMAIL_ALLOWLIST ?? "").split(",")).toContain(email);
  const mail = `http://127.0.0.1:${meta.portBase + 5}`;
  const messages = z.object({
    messages: z.array(z.object({ ID: z.string(), To: z.array(z.object({ Address: z.string() })) })),
  });
  const detail = z.object({ Text: z.string() });
  const existing = messages.parse(await (await request.get(`${mail}/api/v1/messages`)).json());
  const previousIds = new Set(existing.messages.map((message) => message.ID));
  await page.goto("/admin/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send code", exact: true }).click();
  await expect(page.getByLabel("Sign-in code")).toBeVisible();
  let id = "";
  await expect
    .poll(async () => {
      const inbox = messages.parse(await (await request.get(`${mail}/api/v1/messages`)).json());
      id =
        inbox.messages.find(
          (message) =>
            !previousIds.has(message.ID) && message.To.some((to) => to.Address === email),
        )?.ID ?? "";
      return id;
    })
    .not.toBe("");
  const body = detail.parse(await (await request.get(`${mail}/api/v1/message/${id}`)).json());
  const code = body.Text.match(/\b\d{6,8}\b/)?.[0];
  if (!code) throw new Error("Local code email template did not deliver an OTP");
  const invalid = String((Number(code[0]) + 1) % 10) + code.slice(1);
  await page.getByLabel("Sign-in code").fill(invalid);
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page.getByRole("status", { name: "Account status" })).toContainText(
    "couldn’t be verified",
  );
  await page.getByLabel("Sign-in code").fill(code);
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page.getByRole("status", { name: "Account status" })).toHaveText(
    "You’re signed in.",
  );
  const cookies = (await context.cookies()).filter(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
  );
  expect(cookies.length).toBeGreaterThan(0);
  expect(cookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("auth-token");
  expect(
    await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("sb-"))),
  ).toEqual([]);
  const replay = await request.post(`${api.origin}/auth/v1/verify`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
    data: { type: "email", email, token: code },
  });
  expect(replay.ok()).toBe(false);
  await page.getByRole("link", { name: "Sign out", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("status", { name: "Account status" })).toHaveText(
    "You’re signed out on this device.",
  );
  expect((await context.cookies()).filter((cookie) => cookie.name.includes("auth-token"))).toEqual(
    [],
  );
});

for (const fontDelay of [0, 500]) {
  test(`admin sign-in loads without layout shifts with ${fontDelay}ms font delay @smoke`, async ({
    page,
  }) => {
    // Preserve normal loading as well as explicitly exercising a cold font swap.
    if (fontDelay) {
      await page.route("**/*.woff2", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, fontDelay));
        await route.continue();
      });
    }
    await page.addInitScript(() => {
      const state = window as unknown as { authCls: number; authShifts: unknown[] };
      state.authCls = 0;
      state.authShifts = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
            sources: { node?: Node; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[];
          };
          if (!shift.hadRecentInput) {
            state.authCls += shift.value;
            state.authShifts.push({
              value: shift.value,
              sources: shift.sources.map((source) => ({
                node: source.node?.nodeName,
                text: source.node?.textContent?.slice(0, 100),
                before: source.previousRect.toJSON(),
                after: source.currentRect.toJSON(),
              })),
            });
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/admin/sign-in");
    await page.evaluate(() => document.fonts.ready);
    const fallbackFaces = await page.evaluate(async () => {
      const faces = await document.fonts.load('48px "Cormorant Metric Fallback"');
      return faces.map((face) => face.status);
    });
    expect(fallbackFaces).toEqual(["loaded"]);
    // Let the observer receive the final paint before user input can exclude a shift.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const measured = await page.evaluate(() => {
      const state = window as unknown as { authCls: number; authShifts: unknown[] };
      return { authCls: state.authCls, authShifts: state.authShifts };
    });
    expect(measured.authCls, JSON.stringify(measured.authShifts)).toBe(0);
    await page.getByLabel("Email address").focus();
    expect(await page.evaluate(() => (window as unknown as { authCls: number }).authCls)).toBe(0);
  });
}
