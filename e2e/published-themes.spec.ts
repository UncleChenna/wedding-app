import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { getTheme } from "../src/modules/theming";
import { hexToRgb } from "../src/modules/theming/lib/contrast";
import { scanA11y } from "./support/axe";

test("published custom snapshots reach HTML and artifacts while invalid drafts stay private", async ({
  browser,
  request,
  page,
  baseURL,
}, info) => {
  test.skip(
    process.env.RUN_PUBLISHED_THEME_BROWSER !== "1" || info.project.name !== "mobile",
    "Requires isolated database and one worker",
  );
  test.setTimeout(240_000);
  process.loadEnvFile(".env.local");
  const url = process.env.DATABASE_URL ?? "";
  assertDatabaseTarget(url, { localOnly: true });
  const db = postgres(url, { max: 1 });
  const suffix = randomBytes(6).toString("hex");
  const token = randomBytes(32).toString("base64url");
  const ids: string[] = [];
  let invitationId: string | undefined;
  const [original] = await db<
    { active_theme_id: string; active_dark_theme_id: string; updated_at: Date }[]
  >`select active_theme_id, active_dark_theme_id, updated_at from event_settings where id = 1`;
  const folder = "docs/reviews/TICKET-181/screenshots";
  mkdirSync(folder, { recursive: true });
  try {
    const [invitation] = await db<
      { id: string }[]
    >`insert into invitations(token, household_name, status) values(${token}, 'Theme browser fixture', 'sent') returning id`;
    if (!invitation) throw new Error("Missing synthetic invitation");
    invitationId = invitation.id;
    await db`insert into guests(invitation_id, name, is_primary) values(${invitationId}, 'Theme Testguest', true)`;
    for (const [lightId, darkId] of [
      ["blush-sage", "emerald-night"],
      ["ivory-gold", "midnight-champagne"],
    ] as const) {
      const pair = {
        light: { ...getTheme(lightId), id: `t181-${lightId}-${suffix}`, pattern: undefined },
        dark: { ...getTheme(darkId), id: `t181-${darkId}-${suffix}`, pattern: undefined },
      };
      await db.begin(async (tx) => {
        for (const theme of [pair.light, pair.dark]) {
          ids.push(theme.id);
          await tx`insert into themes(id, name, tokens, published_tokens) values(${theme.id}, ${theme.name}, ${tx.json(theme)}, ${tx.json(theme)})`;
        }
        await tx`insert into event_settings(id, active_theme_id, active_dark_theme_id) values(1, ${pair.light.id}, ${pair.dark.id}) on conflict(id) do update set active_theme_id=excluded.active_theme_id, active_dark_theme_id=excluded.active_dark_theme_id`;
      });
      // Fixtures publish directly in SQL. The real action's immediate invalidation
      // is covered by action tests; here wait for the documented 30s cache refresh.
      for (const route of [`/i/${token}`, "/order"]) {
        await expect
          .poll(
            async () => {
              const response = await page.goto(route);
              if (!response) return false;
              const html = await response.text();
              const stylesheet =
                html.match(/<style\b[^>]*data-theme-styles[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? "";
              return stylesheet.includes(`--t-color-background: ${pair.light.colors.background};`);
            },
            { timeout: 65_000, intervals: [1000] },
          )
          .toBe(true);
      }
      for (const scheme of ["light", "dark"] as const) {
        const theme = pair[scheme];
        for (const width of [375, 768, 1280]) {
          const context = await browser.newContext({
            baseURL,
            javaScriptEnabled: false,
            colorScheme: scheme,
            viewport: { width, height: 900 },
            reducedMotion: "reduce",
          });
          try {
            const preview = await context.newPage();
            for (const [name, route] of [
              ["invitation", `/i/${token}`],
              ["order", "/order"],
            ] as const) {
              const response = await preview.goto(route);
              expect(response?.status()).toBe(200);
              if (response && width === 375) {
                await info.attach(`${scheme}-${name}-server-html`, {
                  body: await response.body(),
                  contentType: "text/html",
                });
              }
              expect(await preview.locator("style[data-theme-styles]").textContent()).toContain(
                `--t-color-background: ${theme.colors.background};`,
              );
              expect(
                await preview.evaluate(() => ({
                  background: getComputedStyle(document.documentElement)
                    .getPropertyValue("--t-color-background")
                    .trim(),
                  overflow: document.documentElement.scrollWidth > innerWidth,
                })),
              ).toEqual({ background: theme.colors.background, overflow: false });
              await preview.screenshot({
                path: `${folder}/${theme.id.replace(`-${suffix}`, "")}-${name}-${width}.png`,
                fullPage: true,
              });
            }
          } finally {
            await context.close();
          }
        }
        const context = await browser.newContext({
          baseURL,
          colorScheme: scheme,
          viewport: { width: 375, height: 900 },
        });
        try {
          const preview = await context.newPage();
          for (const route of [`/i/${token}`, "/order"]) {
            await preview.goto(route);
            expect(await scanA11y(preview)).toEqual([]);
          }
        } finally {
          await context.close();
        }
      }
      const image = await request.get("/invitation-preview");
      expect(image.status()).toBe(200);
      const encoded = (await image.body()).toString("base64");
      const pixel = await page.evaluate(async (data) => {
        const bytes = Uint8Array.from(atob(data), (value) => value.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.drawImage(bitmap, 0, 0);
        return {
          width: bitmap.width,
          height: bitmap.height,
          rgb: Array.from(
            context.getImageData(bitmap.width - 2, bitmap.height - 2, 1, 1).data,
          ).slice(0, 3),
        };
      }, encoded);
      expect(pixel).toEqual({
        width: 1200,
        height: 630,
        rgb: hexToRgb(pair.light.colors.background),
      });
      await db`update themes set tokens = ${db.json({ ...pair.light, colors: { ...pair.light.colors, background: "#000000", foreground: "#000000" } })} where id=${pair.light.id}`;
      expect(await (await request.get(`/i/${token}`)).text()).toContain(
        `--t-color-background: ${pair.light.colors.background};`,
      );
      expect(await (await request.get("/invitation-preview")).body()).toEqual(await image.body());
    }
  } finally {
    try {
      if (original)
        await db`update event_settings set active_theme_id=${original.active_theme_id}, active_dark_theme_id=${original.active_dark_theme_id}, updated_at=${original.updated_at} where id=1`;
      else
        await db`delete from event_settings where id=1 and active_theme_id like ${`t181-%-${suffix}`}`;
      if (invitationId) await db`delete from invitations where id=${invitationId}`;
      if (ids.length) await db`delete from themes where id in ${db(ids)}`;
    } finally {
      await db.end();
    }
  }
});
