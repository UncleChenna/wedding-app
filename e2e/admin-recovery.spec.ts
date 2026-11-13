import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import postgres, { type Sql } from "postgres";
import { assertAdminJourneyTarget } from "../scripts/admin-journey-ci";
import { signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";
async function reviewScreens(page: Page, folder: string, name: string, mobile: boolean) {
  for (const theme of mobile ? themes : [themes[0]]) {
    if (!theme) throw new Error("Missing theme");
    await applyTheme(page, theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(await scanA11y(page)).toEqual([]);
    await page.screenshot({ path: `${folder}/${name}-${theme.id}.png`, fullPage: true });
  }
  if (mobile) {
    await page.setViewportSize({ width: 768, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `${folder}/${name}-768.png`, fullPage: true });
    await page.setViewportSize({ width: 375, height: 900 });
  }
}

test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe("reviewed recovery", () => {
  test.skip(process.env.RUN_ADMIN_JOURNEY !== "1", "Requires isolated Auth and database");
  test.setTimeout(180_000);
  let db: Sql;
  test.beforeAll(() => {
    assertAdminJourneyTarget(process.cwd(), process.env);
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1, onnotice: () => {} });
  });
  test.afterAll(async () => {
    if (db) await db.end();
  });
  test("expired scanner exports, admin reviews twice and exact signed receipt clears original records", async ({
    page,
    request,
    context,
  }, info) => {
    await page.setViewportSize({ width: info.project.name === "mobile" ? 375 : 1280, height: 900 });
    const actor = { staffId: randomUUID(), deviceId: randomBytes(32).toString("hex") },
      invitation = randomUUID();
    const event = {
      clientEventId: randomUUID(),
      invitationId: invitation,
      passVersion: 1,
      reportedAt: new Date(Date.now() - 3600_000).toISOString(),
      reportedResult: "valid",
      reportedPeople: 1,
      kind: "admission",
      inputMethod: "qr",
    };
    await db`insert into staff(id,name,role,revoked_at) values(${actor.staffId},'Synthetic recovery gate','gate',now())`;
    await db`insert into registered_devices(id,name,role,revoked_at) values(${actor.deviceId},'Synthetic recovery phone','gate',now())`;
    await db`insert into invitations(id,token,household_name,status) values(${invitation},${randomUUID()},'Synthetic recovery household','rsvp_yes')`;
    await db`insert into rsvps(invitation_id,attending,count_attending) values(${invitation},true,2)`;
    const conflicting = { ...event, clientEventId: randomUUID() };
    await db`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source,input_method)
      values(${conflicting.clientEventId},${invitation},${actor.staffId},${actor.deviceId},${event.reportedAt},'invalid','invalid',0,0,'offline','qr')`;
    const secret = Buffer.from(process.env.STAFF_SESSION_SECRET ?? "", "hex");
    const deviceCookie = `${actor.deviceId}.${createHmac("sha256", secret).update(`staff-device-v1:${actor.deviceId}`).digest("hex")}`;
    const body = Buffer.from(
      JSON.stringify({
        staffId: actor.staffId,
        role: "gate",
        credentialVersion: 1,
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      }),
    ).toString("base64url");
    const session = `${body}.${createHmac("sha256", secret)
      .update(JSON.stringify(["wedding-staff-session-v1", actor.deviceId, body]))
      .digest("base64url")}`;
    const baseURL = String(info.project.use.baseURL);
    await context.addCookies([
      { name: "wedding-staff-device", value: deviceCookie, url: baseURL },
      { name: "wedding-staff-session", value: session, url: baseURL },
    ]);
    await page.goto("/gate-recovery");
    await page.evaluate(
      async ({ actor, event, conflicting }) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open("wedding-scanner-attempts-v1");
          req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains("journal"))
              req.result.createObjectStore("journal");
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction("journal", "readwrite");
          tx.objectStore("journal").put(
            {
              version: 1,
              attempts: [event, conflicting].map((event) => ({
                actor,
                event,
                session: "a".repeat(64),
                rejected: false,
              })),
              receipts: [],
              barriers: [],
            },
            "current",
          );
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      },
      { actor, event, conflicting },
    );
    const refused = await page.evaluate(
      async ({ actor, event }) =>
        (
          await fetch("/api/checkin/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expectedActor: actor, events: [event] }),
          })
        ).status,
      { actor, event },
    );
    expect(refused).toBe(403);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save recovery file" }).click();
    const path = await (await download).path();
    if (!path) throw new Error("Missing export");
    const exported = JSON.parse(readFileSync(path, "utf8"));
    expect(exported.records[0]).toEqual({ actor, event });
    expect(JSON.stringify(exported)).not.toContain('"session"');
    await signInAdmin(
      page,
      request,
      `${process.env.ADMIN_JOURNEY_PREFIX}-recovery-${info.project.name}-${info.retry}@example.test`,
    );
    await page.goto("/admin/scans");
    await page.getByRole("link", { name: "Recover gate records", exact: true }).click();
    await page.getByLabel("Gate recovery file").setInputFiles({
      name: "gate-recovery.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(exported)),
    });
    await expect(page.getByRole("button", { name: "Import reviewed records" })).toBeDisabled();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Import reviewed records" }).click();
    await expect(page.getByRole("main").getByRole("status")).toContainText(
      "1 of 2 records confirmed",
    );
    await page.getByRole("button", { name: "Import reviewed records" }).click();
    await expect(page.getByText("Already recorded", { exact: true })).toBeVisible();
    expect(
      await db`select id from scan_events where client_event_id=${event.clientEventId}`,
    ).toHaveLength(1);
    expect(
      await db`select id from scan_recovery_audits where client_event_id=${event.clientEventId}`,
    ).toHaveLength(1);
    const folder = `docs/reviews/TICKET-231/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    await reviewScreens(page, folder, "admin-review", info.project.name === "mobile");
    const receiptDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save confirmation receipt" }).click();
    const receiptPath = await (await receiptDownload).path();
    if (!receiptPath) throw new Error("Missing receipt");
    const receipt = readFileSync(receiptPath);
    await page.goto("/gate-recovery");
    await page.getByLabel("Administrator’s receipt").setInputFiles({
      name: "forged.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(`x${receipt.toString()}`),
    });
    await expect(page.getByRole("main").getByRole("status")).toContainText(
      "could not be confirmed",
    );
    await page
      .getByLabel("Administrator’s receipt")
      .setInputFiles({ name: "receipt.txt", mimeType: "text/plain", buffer: receipt });
    await expect(page.getByRole("main").getByRole("status")).toContainText(
      "1 confirmed record cleared",
    );
    await page.reload();
    await page
      .getByLabel("Administrator’s receipt")
      .setInputFiles({ name: "receipt.txt", mimeType: "text/plain", buffer: receipt });
    await expect(page.getByRole("main").getByRole("status")).toContainText(
      "0 confirmed records cleared",
    );
    const retainedDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save recovery file" }).click();
    const retainedPath = await (await retainedDownload).path();
    if (!retainedPath) throw new Error("Missing retained evidence export");
    const retained = JSON.parse(readFileSync(retainedPath, "utf8"));
    expect(retained.records).toEqual([{ actor, event: conflicting }]);
    await reviewScreens(page, folder, "device-confirmed", info.project.name === "mobile");
  });
});
