import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type Page } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";

/** Time the real DOM input through React commit, layout and a paint opportunity. */
async function measureUpdate(page: Page, expectedCount: number, act: () => Promise<unknown>) {
  await page.evaluate((count) => {
    const state = window as unknown as { guestTiming: Promise<number> };
    state.guestTiming = new Promise((resolve, reject) => {
      let started = 0;
      let finishing = false;
      const observer = new MutationObserver(check);
      const timeout = setTimeout(() => {
        observer.disconnect();
        reject(new Error("Guest update did not settle"));
      }, 5000);
      function check() {
        if (
          !started ||
          finishing ||
          document.querySelectorAll("[data-invitation-id]").length !== count
        )
          return;
        finishing = true;
        observer.disconnect();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            clearTimeout(timeout);
            resolve(performance.now() - started);
          }),
        );
      }
      function begin() {
        if (started) return;
        started = performance.now();
        for (const kind of ["input", "change", "click"])
          document.removeEventListener(kind, begin, true);
        check();
      }
      for (const kind of ["input", "change", "click"]) document.addEventListener(kind, begin, true);
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    });
  }, expectedCount);
  await act();
  return page.evaluate(() => (window as unknown as { guestTiming: Promise<number> }).guestTiming);
}

test.describe("authenticated guest list", () => {
  test.skip(
    process.env.RUN_ADMIN_GUEST_LIST_TESTS !== "1",
    "Requires isolated local Auth and synthetic fixtures",
  );
  test.setTimeout(240_000);
  test.use({ actionTimeout: 10_000 });
  let db: Sql;
  const ids: string[] = [];
  const lifecycleId = randomUUID();
  const tableId = randomUUID();
  const tag = `Guest review ${randomUUID()}`;
  const longSide = "FamilyAndFriends".repeat(12);
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    await db.begin(async (tx) => {
      await tx`insert into tables(id, number, capacity) select ${tableId}, coalesce(max(number),0)+1, 1000 from tables`;
      for (let index = 0; index < 300; index++) {
        const id = index === 0 ? lifecycleId : randomUUID();
        ids.push(id);
        const status = ["rsvp_yes", "sent", "rsvp_no", "draft", "revoked"][index % 5];
        if (!status) throw new Error("Missing synthetic invitation status");
        await tx`insert into invitations(id, household_name, token, status, side, table_id, sent_at)
          values (${id}, ${`${tag} household ${String(index).padStart(3, "0")}`}, ${randomBytes(32).toString("base64url")}, ${status}, ${index % 2 ? null : longSide}, ${index % 3 ? null : tableId}, ${index % 2 ? null : new Date("2026-11-01T12:00:00Z")})`;
        await tx`insert into guests(invitation_id,name,is_primary) values (${id}, ${`Ada ${index}`}, true), (${id}, ${`Uchenna ${index}`}, false)`;
        if (status === "rsvp_yes" || status === "revoked" || status === "rsvp_no")
          await tx`insert into rsvps(invitation_id,attending,count_attending) values (${id}, ${status !== "rsvp_no"}, ${status === "rsvp_no" ? 0 : 2})`;
      }
    });
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      // Preserve immutable audit evidence if this run exercised lifecycle mutations.
      const audited = await db<
        { invitation_id: string }[]
      >`select invitation_id from invitation_lifecycle_events where invitation_id = any(${ids}::uuid[])`;
      const retained = new Set(audited.map((row) => row.invitation_id));
      const removable = ids.filter((id) => !retained.has(id));
      if (removable.length) await db`delete from invitations where id = any(${removable}::uuid[])`;
      for (const id of retained)
        await db`update invitations set status='revoked', table_id=null where id=${id}`;
      await db`delete from tables where id=${tableId}`;
    } finally {
      await db.end();
    }
  });

  test("300 households render, filter and retain usable admin actions", async ({
    page,
    request,
  }, info) => {
    const prefix = process.env.GUEST_LIST_TEST_PREFIX;
    if (!prefix) throw new Error("Use scripts/test-admin-guest-list.ts");
    await signInAdmin(page, request, `${prefix}-${info.project.name}@example.test`);
    if (info.project.name === "mobile") await page.setViewportSize({ width: 375, height: 900 });
    await page.addInitScript(() => {
      const state = window as unknown as {
        guestLoad: { firstRow: number; painted: number; cls: number };
      };
      state.guestLoad = { firstRow: 0, painted: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) state.guestLoad.cls += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
      const observer = new MutationObserver(() => {
        const count = document.querySelectorAll("[data-invitation-id]").length;
        if (count && !state.guestLoad.firstRow) state.guestLoad.firstRow = performance.now();
        if (count >= 300) {
          observer.disconnect();
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              state.guestLoad.painted = performance.now();
            }),
          );
        }
      });
      observer.observe(document, { subtree: true, childList: true });
    });
    await page.goto("/admin/guests");
    await expect(page.getByRole("heading", { name: "Guests", exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { guestLoad: { painted: number } }).guestLoad.painted,
        ),
      )
      .toBeGreaterThan(0);
    const initial = await page.evaluate(
      () =>
        (window as unknown as { guestLoad: { firstRow: number; painted: number; cls: number } })
          .guestLoad,
    );
    const allCount = await page.locator("[data-invitation-id]").count();
    expect(allCount).toBeGreaterThanOrEqual(300);
    const search = page.getByRole("searchbox", { name: "Search guests" });
    await search.fill(tag);
    await expect(page.locator("[data-invitation-id]")).toHaveCount(300);
    const timings: { operation: string; ms: number }[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      timings.push({
        operation: "filter-to-one",
        ms: await measureUpdate(page, 1, () => search.fill(`${tag} household 001`)),
      });
      timings.push({
        operation: "render-300",
        ms: await measureUpdate(page, 300, () => search.fill(tag)),
      });
    }
    const directory = `docs/reviews/TICKET-089/${info.project.name}`;
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      `${directory}/performance.json`,
      JSON.stringify(
        {
          initial,
          initialRenderMs: initial.painted - initial.firstRow,
          navigationToRowsMs: initial.painted,
          totalInvitations: allCount,
          timings,
        },
        null,
        2,
      ) + "\n",
    );
    await info.attach("guest-list-performance", {
      body: JSON.stringify({ initial, timings }),
      contentType: "application/json",
    });

    // Scan all status colours before narrowing to the action row.
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
    }

    await search.fill(`${tag} Uchenna household 000`);
    await page.getByLabel("Invitation status", { exact: true }).selectOption("rsvp_yes");
    await page.getByLabel("Sent", { exact: true }).selectOption("sent");
    await page.getByLabel("Side", { exact: true }).selectOption(`value:${longSide}`);
    await page.getByLabel("Table", { exact: true }).selectOption(`value:${tableId}`);
    await expect(page.locator(`[data-invitation-id="${lifecycleId}"]`)).toBeVisible();
    await expect(page.locator("[data-invitation-id]")).toHaveCount(1);
    const row = page.locator(`[data-invitation-id="${lifecycleId}"]`);
    await row.getByRole("button", { name: /Invitation actions for/ }).click();
    for (const theme of themes) {
      await applyTheme(page, theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: `${directory}/${theme.id}.png`, fullPage: true });
    }
    const nav = page.getByRole("navigation", { name: "Admin", exact: true });
    for (const name of ["Control room", "Guests", "Sharing", "Menu", "Staff", "Settings"]) {
      const link = nav.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      const bounds = await link.boundingBox();
      expect(bounds && bounds.width >= 44 && bounds.height >= 44).toBe(true);
    }
    const controls = row.getByRole("group", { name: /invitation controls/ });
    if (info.project.name === "mobile") {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const lastAction = await row
        .getByRole("button", { name: "Share invitation", exact: true })
        .boundingBox();
      const navigation = await nav.boundingBox();
      expect(lastAction && navigation && lastAction.y + lastAction.height <= navigation.y).toBe(
        true,
      );
      await page.screenshot({ path: `${directory}/bottom-navigation.png` });
    }
    const reissue = controls.getByRole("button", { name: /Reissue link:/ });
    const [original] = await db<
      { token: string }[]
    >`select token from invitations where id=${lifecycleId}`;
    if (!original) throw new Error("Lifecycle fixture missing");
    await reissue.focus();
    await reissue.press("Enter");
    await expect(page.getByRole("dialog", { name: "Reissue invitation link?" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(reissue).toBeFocused();
    await reissue.press("Enter");
    await page.getByRole("button", { name: "Create new link", exact: true }).click();
    await expect(controls.getByRole("status")).toContainText("New invitation link ready");
    const [updated] = await db<
      { token: string }[]
    >`select token from invitations where id=${lifecycleId}`;
    if (!updated) throw new Error("Lifecycle fixture missing");
    expect(updated.token).not.toBe(original.token);
    expect((await request.get(`/i/${original.token}`)).status()).toBe(404);
    expect((await request.get(`/i/${updated.token}`)).status()).toBe(200);
    await row.getByRole("button", { name: "Share invitation", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      new RegExp(encodeURIComponent(updated.token)),
    );
    await page.keyboard.press("Escape");
    const revoke = controls.getByRole("button", { name: /Revoke invitation:/ });
    await revoke.focus();
    await revoke.press("Enter");
    const confirmation = page.getByRole("dialog", { name: "Revoke invitation?" });
    await confirmation.getByRole("button", { name: "Revoke invitation", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(confirmation).not.toBeVisible();
    await expect(row).toHaveCount(0);
    const resultCount = page.getByRole("search", { name: "Find invitations" }).getByRole("status");
    await expect(resultCount).toBeFocused();
    await expect(resultCount).toHaveText(`0 of ${allCount} invitations`);
    expect((await request.get(`/i/${updated.token}`)).status()).toBe(404);
    expect(initial.painted - initial.firstRow).toBeLessThan(200);
    expect(initial.cls).toBe(0);
    for (const sample of timings) expect(sample.ms, sample.operation).toBeLessThan(200);
  });
});
