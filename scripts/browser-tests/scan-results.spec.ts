import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { generateKeyPairSync, sign } from "node:crypto";
import QRCode from "qrcode";
import { encodeGatePassPayload } from "../../src/modules/checkin/lib/gate-token";

const pair = generateKeyPairSync("ed25519");
const keys = [
  {
    kid: "fixture",
    alg: "Ed25519",
    spki: pair.publicKey.export({ format: "der", type: "spki" }).toString("base64url"),
  },
];
const payload = {
  v: 1 as const,
  kid: "fixture",
  inv: "550e8400-e29b-41d4-a716-446655440000",
  ver: 1,
  iat: 0,
};
const body = encodeGatePassPayload(payload);
const token = `${body}.${sign(null, Buffer.from(body), pair.privateKey).toString("base64url")}`;
const row = {
  status: "rsvp_yes",
  tokenVersion: 1,
  attending: true,
  countAttending: 4,
  primaryNames: ["Synthetic guest"],
  householdName: null,
  tableNumber: 7,
  admittedSoFar: 2,
  admissions: [],
};

for (const [title, data] of [
  ["Valid pass", row],
  ["Already used", { ...row, admittedSoFar: 4 }],
  ["Revoked pass", { ...row, status: "revoked" }],
  ["Replaced pass", { ...row, tokenVersion: 2 }],
  ["Not RSVP’d", { ...row, status: "sent", attending: null, countAttending: 0, admittedSoFar: 0 }],
  ["Not on this device’s list yet", null],
] as const)
  test(`actual camera and cached signature resolver: ${title}`, async ({ page }) => {
    const bundle = await build({
      stdin: {
        contents: `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {Scanner} from './src/modules/checkin/components/scanner';
    import {resolveScanRead} from './src/modules/checkin/lib/resolve-scan-read';
    createRoot(document.getElementById('root')).render(<Scanner resolveRead={(qr,signal)=>resolveScanRead(qr,location.origin,window.fixtureKeys,async(id)=>{
      if(id!=='${payload.inv}') throw new Error('Wrong signed identity');
      return window.fixtureRow;
    })}/>);
  `,
        resolveDir: process.cwd(),
        loader: "tsx",
      },
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      define: { "process.env.NODE_ENV": '"production"' },
      jsx: "automatic",
    });
    const script = bundle.outputFiles[0];
    if (!script) throw new Error("Missing fixture bundle");
    const qr = await QRCode.toDataURL(`http://localhost:32919/p/${token}`, {
      width: 512,
      margin: 4,
    });
    await page.route("http://localhost:32919/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><title>Cached scanner fixture</title><div id="root"></div>',
      }),
    );
    await page.goto("http://localhost:32919/");
    await page.evaluate(
      ({ keys, row, qr, title }) => {
        Object.assign(window, {
          fixtureKeys: keys,
          fixtureRow: row,
          scanStarted: 0,
          scanFinished: 0,
        });
        const observer = new MutationObserver(() => {
          if ([...document.querySelectorAll("h2")].some((h) => h.textContent === title)) {
            Object.assign(window, { scanFinished: performance.now() });
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        let captures = 0;
        Object.defineProperty(navigator, "mediaDevices", {
          configurable: true,
          value: {
            getUserMedia: async () => {
              captures += 1;
              const canvas = document.createElement("canvas");
              canvas.width = canvas.height = 512;
              const ctx = canvas.getContext("2d");
              if (!ctx) throw new Error("Canvas missing");
              const image = new Image();
              image.src = qr;
              await image.decode();
              const stream = canvas.captureStream(15);
              const paint = () => {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, 512, 512);
                // The next guest has not presented a pass yet. Leaving the same
                // QR in this new stream would immediately produce another result.
                if (captures === 1) ctx.drawImage(image, 0, 0);
              };
              Object.assign(window, { scanStarted: performance.now() });
              paint();
              const timer = setInterval(paint, 50);
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
      },
      { keys, row: data, qr, title },
    );
    await page.addScriptTag({ content: script.text });
    await page.getByRole("button", { name: "Open camera" }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    const duration = await page.evaluate(() => {
      const timing = window as unknown as { scanStarted: number; scanFinished: number };
      return timing.scanFinished - timing.scanStarted;
    });
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1000);
    if (title === "Valid pass")
      await expect(page.getByText(/No admission has been recorded/)).toBeVisible();
    await page.getByRole("button", { name: "Scan next pass" }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
  });
