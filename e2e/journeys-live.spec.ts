import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { assertDatabaseTarget } from "../scripts/database-target";
import { appRoutes, invitationHref, passHref, routeList } from "../src/modules/shared/lib/routes";
import { localAdminLogin } from "./support/local-admin-login";
import { reviewAdminJourneys } from "./support/journey-review";
import { totp } from "./support/totp";
import { crawlRoutes, requireReachableRoutes } from "./support/journey-crawl";

test("all production journeys connect, including authenticated sharing", async ({
  page,
  request,
  context,
}, info) => {
  test.skip(
    process.env.RUN_JOURNEY_TESTS !== "1",
    "Requires the explicitly enabled isolated local Auth and RSVP fixture",
  );
  test.setTimeout(process.env.CAPTURE_JOURNEY_REVIEW === "1" ? 240_000 : 120_000);
  process.loadEnvFile(".env.local");
  const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
  expect(meta.path).toBe(process.cwd());
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  const db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  const ids: string[] = [];
  let factorId = "";
  let authCookies: { name: string; value: string }[] = [];
  const suffix = randomBytes(5).toString("hex");
  const token = randomBytes(32).toString("base64url");
  const name = "Journey household " + suffix;
  const visited = new Set<string>();
  const recordCurrent = () => visited.add(new URL(page.url()).pathname);
  try {
    const [settings] = await db`select venue from event_settings where id=1`;
    expect(settings?.venue).toBe("RSVP browser test only");
    for (const status of ["sent", "draft", "revoked"]) {
      const [row] = await db<{ id: string }[]>`insert into invitations(token,household_name,status)
        values(${status === "sent" ? token : randomBytes(32).toString("base64url")},${name + " " + status},${status})
        returning id`;
      if (!row) throw new Error("Missing synthetic invitation");
      ids.push(row.id);
    }
    await localAdminLogin(page, request, `journeys-${info.project.name}@example.test`);
    authCookies = await context.cookies();
    recordCurrent();
    await expect(page.getByRole("link", { name: "Back to our day" })).toBeVisible();
    await page.getByRole("link", { name: "Continue to admin" }).click();
    await expect(page).toHaveURL(/\/admin\/mfa$/);
    recordCurrent();
    await page.getByRole("button", { name: "Set up authenticator" }).click();
    const key = page.getByTestId("setup-key");
    await expect(key).toBeVisible();
    const secret = (await key.textContent()) ?? "";
    factorId = await page.locator("input[name=factorId]").inputValue();
    await page.getByLabel("Authenticator code").fill(totp(secret));
    await page.getByRole("button", { name: "Verify code" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    authCookies = await context.cookies();
    recordCurrent();
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Sharing", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/sharing$/);
    const published = page
      .locator("li")
      .filter({ has: page.getByRole("heading", { name: name + " sent", exact: true }) });
    for (const status of ["draft", "revoked"]) {
      const unavailable = page
        .locator("li")
        .filter({ has: page.getByRole("heading", { name: name + " " + status, exact: true }) });
      await expect(unavailable).toBeVisible();
      await expect(unavailable.getByRole("button", { name: "Share invitation" })).toHaveCount(0);
    }
    await published.getByRole("button", { name: "Share invitation" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const whatsapp = dialog.getByRole("link", { name: /WhatsApp/ });
    const href = await whatsapp.getAttribute("href");
    expect(href).toBeTruthy();
    const message = new URL(href ?? "").searchParams.get("text") ?? "";
    expect(message).toContain(invitationHref(token));
    expect(message.split(invitationHref(token))).toHaveLength(2);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(published.getByRole("button", { name: "Share invitation" })).toBeFocused();
    const [unchanged] = await db`select status from invitations where token=${token}`;
    expect(unchanged?.status).toBe("sent");

    await reviewAdminJourneys(page, name + " sent");

    const registered = routeList
      .filter((route) => route.audience !== "dev")
      .map((route) => route.path);
    const backs = new Map([
      [appRoutes.invite.path, appRoutes.home.path],
      [appRoutes.invitation.path, appRoutes.home.path],
      [appRoutes.pass.path, appRoutes.home.path],
      [appRoutes.order.path, appRoutes.home.path],
      [appRoutes.checkin.path, appRoutes.staff.path],
      [appRoutes.kitchen.path, appRoutes.staff.path],
      [appRoutes.bar.path, appRoutes.staff.path],
      [appRoutes.adminSharing.path, appRoutes.admin.path],
      [appRoutes.adminSignOut.path, appRoutes.admin.path],
    ]);
    const found = await crawlRoutes(
      page,
      [
        appRoutes.home.path,
        invitationHref(token),
        passHref("invalid"),
        appRoutes.order.path,
        appRoutes.staff.path,
        appRoutes.admin.path,
      ],
      registered,
      new Map([
        [invitationHref(token), appRoutes.invitation.path],
        [passHref("invalid"), appRoutes.pass.path],
      ]),
      backs,
    );
    for (const path of found) visited.add(path);

    // Offline is an automatic worker entry, not a menu page: prove the fallback from a guest route.
    await page.goto(appRoutes.home.path);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true);
    expect(
      await page.evaluate(async () => {
        for (const name of await caches.keys()) {
          const cached = await (await caches.open(name)).match("/offline");
          if (cached?.status === 200) return true;
        }
        return false;
      }),
    ).toBe(true);
    await context.setOffline(true);
    await page.goto(invitationHref(token));
    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to our day" })).toBeVisible();
    visited.add(appRoutes.offline.path);
    await context.setOffline(false);
    requireReachableRoutes(registered, visited);
    await info.attach("visited-production-routes", {
      body: JSON.stringify([...visited].sort(), null, 2),
      contentType: "application/json",
    });
  } finally {
    // Cleanup uses captured cookies, so a closed browser cannot prevent fixture cleanup.
    try {
      if (factorId) {
        const auth = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
          { cookies: { getAll: () => authCookies, setAll: () => {} } },
        );
        const result = await auth.auth.mfa.unenroll({ factorId });
        expect(result.error, "Remove only this synthetic account's factor").toBeNull();
      }
    } finally {
      try {
        if (ids.length) await db`delete from invitations where id in ${db(ids)}`;
      } finally {
        await db.end();
      }
    }
  }
});
