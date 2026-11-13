import {
  createPrivateKey,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  sign,
} from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import postgres from "postgres";
import QRCode from "qrcode";
import { expect, test, type Page } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { encodeGatePassPayload } from "../src/modules/checkin/lib/gate-token";
import { createOfflineQueuePolicy } from "../src/modules/checkin/lib/offline-queue";

async function journal(page: Page) {
  const raw = await page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open("wedding-scanner-attempts-v1");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction("journal", "readonly");
          const read = transaction.objectStore("journal").get("current");
          read.onsuccess = () => resolve(read.result);
          read.onerror = () => reject(read.error);
          transaction.oncomplete = () => db.close();
        };
      }),
  );
  const parsed = createOfflineQueuePolicy().parse(raw);
  if (!parsed) throw new Error("Product journal is malformed");
  return parsed;
}

test.use({ trace: "off", screenshot: "off", video: "off" });
test("two offline scanners retain fifty QR scans and reconcile a shared allowance exactly once", async ({
  browser,
  baseURL,
}, info) => {
  test.skip(process.env.RUN_OFFLINE_QUEUE !== "1", "Requires owned synthetic database");
  test.setTimeout(240_000);
  if (!baseURL) throw new Error("Production URL required");
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  const db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
  const staff = randomUUID(),
    venue = `offline-gate-${randomUUID()}`;
  const invitationIds = Array.from({ length: 49 }, () => randomUUID());
  const shared = invitationIds[0];
  if (!shared) throw new Error("Shared household required");
  const pin = String(randomInt(100000, 1000000)),
    salt = randomBytes(32);
  const hash = `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
  const contexts = await Promise.all(
    [0, 1].map(() => browser.newContext({ baseURL, viewport: info.project.use.viewport })),
  );
  const progress = { scanner: -1, scan: -1, phase: "setup" };
  const syncResponses: { status: number; at: number }[] = [];
  for (const context of contexts)
    context.on("response", (response) => {
      if (new URL(response.url()).pathname === "/api/checkin/sync")
        syncResponses.push({ status: response.status(), at: Date.now() });
    });
  try {
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${staff},'Synthetic offline gate operator','gate',${hash},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
    const key = createPrivateKey({
      key: Buffer.from(process.env.GATE_SIGNING_PRIVATE_KEY ?? "", "base64url"),
      type: "pkcs8",
      format: "der",
    });
    const codes: string[] = [];
    for (const id of invitationIds) {
      await db`insert into invitations(id,token,status,household_name) values(${id},${randomUUID().replaceAll("-", "")},'rsvp_yes','Synthetic offline household')`;
      await db`insert into guests(invitation_id,name,is_primary) values(${id},${`Offline guest ${id.slice(0, 8)}`},true)`;
      await db`insert into rsvps(invitation_id,attending,count_attending) values(${id},true,${id === shared ? 4 : 1})`;
      const body = encodeGatePassPayload({ v: 1, kid: "snapshot-test", inv: id, ver: 1, iat: 0 });
      const token = `${body}.${sign(null, Buffer.from(body), key).toString("base64url")}`;
      codes.push(await QRCode.toDataURL(`${baseURL}/p/${token}`, { width: 512, margin: 4 }));
    }
    const pages = await Promise.all(
      contexts.map(async (context) => {
        await context.addInitScript(() => {
          Object.defineProperty(navigator, "mediaDevices", {
            configurable: true,
            value: {
              getUserMedia: async () => {
                const canvas = document.createElement("canvas");
                canvas.width = canvas.height = 512;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas unavailable");
                const image = new Image();
                image.src = sessionStorage.getItem("synthetic-camera-qr") ?? "";
                await image.decode();
                const paint = () => ctx.drawImage(image, 0, 0);
                paint();
                const stream = canvas.captureStream(15),
                  timer = setInterval(paint, 50);
                for (const track of stream.getTracks()) {
                  const stop = track.stop.bind(track);
                  track.stop = () => {
                    clearInterval(timer);
                    stop();
                  };
                }
                return stream;
              },
            },
          });
        });
        const page = await context.newPage();
        await page.goto("/checkin");
        await page.getByLabel("Your six-digit PIN").fill(pin);
        await page.getByRole("button", { name: "Sign in", exact: true }).click();
        await expect(page.getByText("Guest list saved just now.")).toBeVisible({ timeout: 20_000 });
        await expect(
          page.getByText(
            "Camera ready for an offline reload. Saved guest checks do not record entry.",
            { exact: true },
          ),
        ).toBeVisible();
        await context.setOffline(true);
        await page.reload();
        return page;
      }),
    );
    for (const [scanner, page] of pages.entries()) {
      progress.scanner = scanner;
      for (let index = 0; index < 25; index++) {
        progress.scan = index;
        progress.phase = "camera";
        const code = codes[index === 0 ? 0 : 1 + scanner * 24 + index - 1];
        if (!code) throw new Error("QR fixture missing");
        await page.evaluate((src) => sessionStorage.setItem("synthetic-camera-qr", src), code);
        if (index === 12) {
          const before = await journal(page);
          await page.reload();
          expect(await journal(page)).toEqual(before);
        }
        await page
          .getByRole("button", {
            name: index === 0 || index === 12 ? "Open camera" : "Scan next pass",
            exact: true,
          })
          .click();
        await expect(page.getByRole("heading", { name: "Valid pass", exact: true })).toBeVisible();
        await page
          .getByRole("spinbutton", { name: "Guests entering now" })
          .fill(index === 0 ? "4" : "1");
        await page.getByRole("button", { name: "Save offline entry", exact: true }).click();
        await expect(
          page.getByRole("heading", { name: "Entry saved on this phone", exact: true }),
        ).toBeVisible();
      }
    }
    const saved = await Promise.all(pages.map(journal));
    for (const state of saved) {
      expect(state.attempts).toHaveLength(50);
      expect(state.attempts.filter((row) => row.event.kind === "admission")).toHaveLength(25);
      expect(new Set(state.attempts.map((row) => row.event.clientEventId)).size).toBe(50);
    }
    expect(saved[0]?.attempts[0]?.actor.deviceId).not.toBe(saved[1]?.attempts[0]?.actor.deviceId);
    expect(
      await db`select id from scan_events where invitation_id in ${db(invitationIds)}`,
    ).toHaveLength(0);
    for (const [index, context] of contexts.entries()) {
      const page = pages[index];
      const state = saved[index];
      if (!page || !state) throw new Error("Scanner fixture missing");
      await page.reload();
      expect(await journal(page)).toEqual(state);
      progress.scanner = index;
      progress.phase = "reconnect";
      await context.setOffline(false);
      await page.getByRole("button", { name: "Retry sync", exact: true }).click();
      await expect.poll(async () => (await journal(page)).attempts.length).toBe(0);
      const replay = await context.request.post("/api/checkin/sync", {
        headers: { Origin: baseURL },
        data: {
          expectedActor: state.attempts[0]?.actor,
          events: state.attempts.map((row) => row.event),
        },
      });
      expect(replay.status()).toBe(200);
    }
    const [totals] =
      await db`select count(*)::int as rows, count(distinct client_event_id)::int as ids, sum(reported_people)::int as reported, sum(admitted_people)::int as admitted from scan_events where invitation_id in ${db(invitationIds)}`;
    expect(totals).toEqual({ rows: 100, ids: 100, reported: 56, admitted: 52 });
    const retained = await db<
      { client_event_id: string }[]
    >`select client_event_id from scan_events where invitation_id in ${db(invitationIds)}`;
    expect(retained.map((row) => row.client_event_id).sort()).toEqual(
      saved.flatMap((state) => state.attempts.map((row) => row.event.clientEventId)).sort(),
    );
    const [allCounters] =
      await db`select sum(admitted_people)::int as admitted from admission_counters where invitation_id in ${db(invitationIds)}`;
    expect(allCounters?.admitted).toBe(52);
    const [conflict] =
      await db`select sum(reported_people)::int as reported, sum(admitted_people)::int as admitted, count(*) filter(where conflict)::int as conflicts from scan_events where invitation_id=${shared}`;
    expect(conflict).toEqual({ reported: 8, admitted: 4, conflicts: 1 });
    const [counter] =
      await db`select admitted_people from admission_counters where invitation_id=${shared}`;
    expect(counter?.admitted_people).toBe(4);
    mkdirSync("docs/reviews/TICKET-136", { recursive: true });
    writeFileSync(
      `docs/reviews/TICKET-136/${info.project.name}-reconciliation.json`,
      JSON.stringify(
        { qrScans: 50, scanners: 2, totals, conflict, exactEventIdsRetained: true },
        null,
        2,
      ) + "\n",
    );
    await info.attach("reconciliation", {
      body: JSON.stringify({ totals, conflict }),
      contentType: "application/json",
    });
  } catch (error) {
    const states = await Promise.all(
      contexts.map(async (context) => {
        const page = context.pages()[0];
        if (!page || page.isClosed()) return { unavailable: true };
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          return await Promise.race([
            page.evaluate(() => ({
              online: navigator.onLine,
              visibility: document.visibilityState,
              controller: Boolean(navigator.serviceWorker.controller),
              headings: [...document.querySelectorAll("h1,h2")].map((node) =>
                node.textContent?.slice(0, 160),
              ),
              statuses: [...document.querySelectorAll('[role="status"],[role="alert"]')].map(
                (node) => node.textContent?.slice(0, 200),
              ),
              buttons: [...document.querySelectorAll("button")].map((node) => ({
                text: node.textContent?.slice(0, 80),
                disabled: node.disabled,
              })),
            })),
            new Promise<{ unavailable: true }>((resolve) => {
              timer = setTimeout(() => resolve({ unavailable: true }), 3000);
            }),
          ]);
        } catch {
          return { unavailable: true };
        } finally {
          clearTimeout(timer);
        }
      }),
    );
    await info.attach("scanner-failure-state.json", {
      body: JSON.stringify({ progress, syncResponses: syncResponses.slice(-10), states }),
      contentType: "application/json",
    });
    throw error;
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await db`update staff set revoked_at=now() where id=${staff}`;
    await db`update registered_devices set revoked_at=coalesce(revoked_at,now()) where registered_by_staff_id=${staff}`;
    await db`delete from event_settings where id=1 and venue=${venue}`;
    await db.end();
  }
});
