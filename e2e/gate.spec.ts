import {
  createPrivateKey,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  sign,
} from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres from "postgres";
import QRCode from "qrcode";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { encodeGatePassPayload } from "../src/modules/checkin/lib/gate-token";

// Only generated synthetic passes enter the camera. Do not publish recordings
// or traces containing even these temporary credentials.
test.use({ trace: "off", screenshot: "off", video: "off" });
test("camera pixels show all five gate results without admitting anyone", async ({
  page,
  context,
  baseURL,
}, info) => {
  test.skip(process.env.RUN_ADMISSION_JOURNEY !== "1", "Requires isolated synthetic gate fixtures");
  test.setTimeout(120_000);
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  const url = process.env.DATABASE_URL ?? "";
  assertDatabaseTarget(url, { localOnly: true });
  const db = postgres(url, { max: 1 });
  const staff = randomUUID(),
    device = randomUUID(),
    table = randomUUID();
  const venue = `gate-matrix-${randomUUID()}`,
    number = randomInt(100000, 999999);
  const pin = String(randomInt(100000, 1000000)),
    salt = randomBytes(32);
  const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const cases = [
    { state: "valid", title: "Valid pass", status: "rsvp_yes" },
    { state: "already_used", title: "Already used", status: "rsvp_yes" },
    { state: "invalid", title: "Invalid pass", status: null },
    { state: "revoked", title: "Revoked pass", status: "revoked" },
    { state: "not_rsvped", title: "Not RSVP’d", status: "sent" },
  ] as const;
  const ids = new Map<string, string>();
  const frames: string[] = [];
  try {
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${staff},'Synthetic gate matrix','gate',${`scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
    await db`insert into registered_devices(id,name,role,registered_by_staff_id) values(${device},'Synthetic previously used scanner','gate',${staff})`;
    await db`insert into tables(id,number,capacity) values(${table},${number},8)`;
    const key = createPrivateKey({
      key: Buffer.from(process.env.GATE_SIGNING_PRIVATE_KEY ?? "", "base64url"),
      format: "der",
      type: "pkcs8",
    });
    for (const item of cases) {
      let qr = "synthetic invalid gate pass";
      if (item.status) {
        const id = randomUUID();
        ids.set(item.state, id);
        await db`insert into invitations(id,token,status,table_id) values(${id},${randomUUID().replaceAll("-", "")},${item.status},${table})`;
        await db`insert into guests(invitation_id,name,is_primary,dietary_notes) values(${id},${`Synthetic ${item.state} guest`},true,'PRIVATE MATRIX DIET')`;
        if (item.state !== "not_rsvped")
          await db`insert into rsvps(invitation_id,attending,count_attending,message) values(${id},true,2,'PRIVATE MATRIX RSVP')`;
        if (item.state === "already_used")
          await db`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source) values(${randomUUID()},${id},${staff},${device},now(),'valid','valid',2,2,'online')`;
        const payload = encodeGatePassPayload({ v: 1, kid: "scan-test", inv: id, ver: 1, iat: 0 });
        qr = `${baseURL}/p/${payload}.${sign(null, Buffer.from(payload), key).toString("base64url")}`;
      }
      frames.push(await QRCode.toDataURL(qr, { width: 512, margin: 4 }));
    }
    await page.addInitScript(() => {
      const state = window as unknown as { gateFrame: string; gateTracks: MediaStreamTrack[] };
      state.gateFrame = "";
      state.gateTracks = [];
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 512;
            const draw = canvas.getContext("2d");
            if (!draw) throw new Error("Missing camera canvas");
            const image = new Image();
            image.src = state.gateFrame;
            await image.decode();
            const stream = canvas.captureStream(15);
            const paint = () => draw.drawImage(image, 0, 0);
            paint();
            const timer = setInterval(paint, 50);
            for (const track of stream.getTracks()) {
              const stop = track.stop.bind(track);
              track.stop = () => {
                clearInterval(timer);
                stop();
              };
              state.gateTracks.push(track);
            }
            return stream;
          },
        },
      });
    });
    await page.goto("/checkin");
    await page.getByLabel("Your six-digit PIN").fill(pin);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Open camera", exact: true })).toBeVisible();
    const browserDevice = (await context.cookies())
      .find((cookie) => cookie.name === "wedding-staff-device")
      ?.value.split(".")[0];
    expect(browserDevice).toMatch(/^[a-f0-9]{64}$/);
    const folder = `docs/reviews/TICKET-132/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    for (const [index, item] of cases.entries()) {
      const frame = frames[index];
      if (!frame) throw new Error("Missing synthetic frame");
      await page.evaluate((src) => {
        (window as unknown as { gateFrame: string }).gateFrame = src;
      }, frame);
      await page
        .getByRole("button", { name: index === 0 ? "Open camera" : "Scan next pass", exact: true })
        .click();
      await expect(page.getByRole("heading", { name: item.title, exact: true })).toBeVisible();
      if (item.state === "valid") {
        await expect(page.getByText(`Table ${number}`, { exact: true })).toBeVisible();
        await expect(page.getByLabel("How many are here?")).toHaveValue("2");
      } else {
        await expect(page.getByRole("button", { name: /^Admit / })).toHaveCount(0);
      }
      expect(await page.content()).not.toMatch(/PRIVATE MATRIX DIET|PRIVATE MATRIX RSVP/);
      expect(
        await page.evaluate(() => {
          const tracks = (window as unknown as { gateTracks: MediaStreamTrack[] }).gateTracks;
          return tracks.length > 0 && tracks.every((track) => track.readyState === "ended");
        }),
      ).toBe(true);
      const observations =
        await db`select result,input_method,source,admitted_people from scan_events where staff_id=${staff} and device_id=${browserDevice ?? ""} and result=${item.state} and reported_people=0`;
      expect(observations).toEqual([
        { result: item.state, input_method: "qr", source: "online", admitted_people: 0 },
      ]);
      await page.screenshot({ path: `${folder}/${item.state}.png`, fullPage: true });
    }
    // Reads must never grant admission. Only the pre-existing used-pass fixture has entry evidence.
    expect(
      await db`select invitation_id,admitted_people from scan_events where staff_id=${staff} and admitted_people>0`,
    ).toEqual([{ invitation_id: ids.get("already_used"), admitted_people: 2 }]);
  } finally {
    await db`delete from event_settings where id=1 and venue=${venue}`;
    // Audit events are append-only: retain synthetic FK targets and retire credentials.
    await db`update registered_devices set revoked_at=now() where registered_by_staff_id=${staff}`;
    await db`update staff set revoked_at=now(),pin_hash=null,pin_issued_at=null,pin_expires_at=null where id=${staff}`;
    await db.end();
  }
});
