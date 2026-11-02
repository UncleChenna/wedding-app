// @vitest-environment jsdom
import { generateKeyPairSync } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import jsQR from "jsqr";
import { expect, it } from "vitest";
import { QrPass } from "../components/qr-pass";
import { themes } from "@/modules/theming/themes";
import { contrastRatio, hexToRgb } from "@/modules/theming/lib/contrast";
import { loadGateSigningKeys, signGatePass } from "@/modules/checkin/server/signing";
import { gatePassUrl } from "@/modules/checkin/lib/pass-url";

const pair = generateKeyPairSync("ed25519");
const keys = loadGateSigningKeys({
  GATE_SIGNING_KEY_ID: "test-044-long-domain",
  GATE_SIGNING_PRIVATE_KEY: pair.privateKey
    .export({ format: "der", type: "pkcs8" })
    .toString("base64url"),
});
if (!keys.ok) throw new Error("Test key unavailable");
const url = gatePassUrl(
  "https://uchenna-and-adaora.example.com",
  signGatePass(
    {
      invitationId: "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f",
      tokenVersion: 2147483647,
    },
    keys.value,
  ),
);
const html = renderToStaticMarkup(
  <QrPass url={url} pass={{ names: ["Ada"], householdName: null, partySize: 2, tableNumber: 7 }} />,
);
it.each(themes)("decodes the rendered signed SVG with quiet zone and AA contrast: $id", (theme) => {
  const container = document.createElement("div");
  container.innerHTML = html;
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("QR SVG missing");
  const side = Number(svg.getAttribute("viewBox")?.split(" ")[2]);
  const modules = Number(svg.getAttribute("data-qr-modules"));
  expect(side - modules).toBe(8);
  const path = svg.querySelector("path")?.getAttribute("d") ?? "";
  const points = [...path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);
  expect(points.length).toBeGreaterThan(100);
  expect(Math.min(...points.flat())).toBe(4);
  expect(Math.max(...points.flat())).toBe(side - 5);
  const dark = new Set(points.map(([x, y]) => x + "," + y));
  const scale = 4;
  const size = side * scale;
  const pixels = new Uint8ClampedArray(size * size * 4);
  const ink = theme.colors["qr-ink"];
  const paper = theme.colors["qr-paper"];
  expect(contrastRatio(ink, paper)).toBeGreaterThanOrEqual(4.5);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const rgb = hexToRgb(
        dark.has(Math.floor(x / scale) + "," + Math.floor(y / scale)) ? ink : paper,
      );
      pixels.set([...rgb, 255], (y * size + x) * 4);
    }
  expect(jsQR(pixels, size, size, { inversionAttempts: "dontInvert" })?.data).toBe(url);
  expect(container.querySelector("a")?.getAttribute("href")).toBe(url);
  expect(container.textContent).toContain(
    "This is your key to the celebration. Show it at the door.",
  );
});
