import { generateKeyPairSync } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { expect, it } from "vitest";
import { renderInvitationPdf } from "../server/pdf";
import { listThemes } from "@/modules/theming/lib/registry";
import { defaultEventSettings, type EventSettings } from "@/modules/shared/lib/event-settings";
import { loadGateSigningKeys, signGatePass } from "@/modules/checkin/server/signing";
import { gatePassUrl } from "@/modules/checkin/lib/pass-url";

it.skipIf(process.env.RUN_PDF_REVIEW !== "1")(
  "exports all themes and long-name samples for independent 300dpi review",
  async () => {
    const pair = generateKeyPairSync("ed25519");
    const keys = loadGateSigningKeys({
      GATE_SIGNING_KEY_ID: "pdf-review",
      GATE_SIGNING_PRIVATE_KEY: pair.privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    });
    if (!keys.ok) throw new Error("Review key unavailable");
    const passUrl = gatePassUrl(
      "https://uchenna-and-adaora.example.com",
      signGatePass(
        {
          invitationId: "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f",
          tokenVersion: 2147483647,
        },
        keys.value,
      ),
    );
    const output = "artifacts/TICKET-046";
    await mkdir(output, { recursive: true });
    const results = [];
    for (const theme of listThemes()) {
      for (const long of [false, true]) {
        const start = performance.now();
        const buffer = await renderInvitationPdf({
          details: { ...defaultEventSettings, coupleNames: ["Uchenna", "Adaora"] } as EventSettings,
          theme,
          pass: {
            names: [long ? "Adaora Chiamaka Nwankwo Okafor ".repeat(6).trim() : "Ada Nwosu"],
            householdName: null,
            partySize: 2,
            tableNumber: 8,
          },
          passUrl,
        });
        const elapsed = performance.now() - start;
        const name = theme.id + (long ? "-long" : "");
        await writeFile(output + "/" + name + ".pdf", buffer);
        results.push({ name, milliseconds: elapsed, bytes: buffer.length });
        expect(elapsed).toBeLessThan(2000);
      }
    }
    await writeFile(output + "/review.json", JSON.stringify({ passUrl, results }, null, 2));
  },
  30000,
);
