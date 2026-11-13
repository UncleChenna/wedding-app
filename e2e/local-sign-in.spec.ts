import { existsSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { localBudgetIdentity } from "./support/local-budget-identity";

/**
 * TICKET-250: the local-only shared code 000000 opens admin and every staff station on a local
 * production build. Run with a fresh allowlisted address:
 *   E=local-$RANDOM@example.test; ADMIN_EMAIL_ALLOWLIST=$E LOCAL_SIGN_IN_TEST_EMAIL=$E \
 *   STAFF_SESSION_SECRET=$(openssl rand -hex 32) RUN_LOCAL_SIGN_IN_E2E=1 \
 *   pnpm exec playwright test e2e/local-sign-in.spec.ts --project=mobile
 */
const email = process.env.LOCAL_SIGN_IN_TEST_EMAIL ?? "";
let db: Sql;
let restoreSettings: (() => Promise<unknown>) | undefined;

test.describe("local sign-in code", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    process.env.RUN_LOCAL_SIGN_IN_E2E !== "1" || !email,
    "Needs a local stack, LOCAL_SIGN_IN_TEST_EMAIL on ADMIN_EMAIL_ALLOWLIST and STAFF_SESSION_SECRET",
  );

  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, onnotice: () => {} });
    const [settings] = await db<{ date: string | null; zone: string | null }[]>`
      select event_date::text as date, time_zone as zone from event_settings where id = 1`;
    await db`update event_settings set event_date = (now() + interval '7 days')::date,
      time_zone = 'Africa/Lagos' where id = 1`;
    restoreSettings = () =>
      db`update event_settings set event_date = ${settings?.date ?? null}, time_zone = ${settings?.zone ?? null} where id = 1`;
  });
  test.beforeEach(async () => {
    await db`delete from request_budgets where scope = 'pin' and identity = ${localBudgetIdentity()}`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await restoreSettings?.();
    } finally {
      await db.end();
    }
  });

  test("admin: 000000 passes the email step and the authenticator step", async ({ page }) => {
    await page.goto("/admin/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Send code", exact: true }).click();
    await page.getByLabel("Sign-in code").fill("123456");
    await page.getByRole("button", { name: "Verify code" }).click();
    await expect(page.getByText("That code couldn’t be verified.", { exact: false })).toBeVisible();
    await page.getByLabel("Sign-in code").fill("000000");
    await page.getByRole("button", { name: "Verify code" }).click();
    await expect(page.getByRole("status", { name: "Account status" })).toHaveText(
      "You’re signed in.",
    );

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/mfa$/);
    await page.getByRole("button", { name: "Set up authenticator" }).click();
    await page.getByLabel("Authenticator code").fill("000000");
    await page.getByRole("button", { name: "Verify code" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: "Wedding control room", exact: true }),
    ).toBeVisible();
  });

  for (const [path, role] of [
    ["/kitchen", "kitchen"],
    ["/bar", "bar"],
    ["/checkin", "gate"],
  ] as const)
    test(`staff: 000000 opens ${path} as the local ${role} tester`, async ({ page }) => {
      await page.goto(path);
      await page.getByLabel("Your six-digit PIN").fill("000000");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page.getByRole("button", { name: "Sign out" }).first()).toBeVisible();
      const [tester] = await db<{ n: number }[]>`select count(*)::int as n from staff
        where name = ${`Local ${role} tester`} and role = ${role} and revoked_at is null`;
      expect(tester?.n).toBe(1);
    });
});
