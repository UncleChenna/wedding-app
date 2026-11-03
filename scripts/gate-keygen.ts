/**
 * Generate a new Ed25519 gate signing key pair as environment lines (ADR 0021).
 * Usage: pnpm gate:keygen [key-id]
 * Paste the output into the deployment's secret store, never into a committed file.
 */
import { generateKeyPairSync } from "node:crypto";

import { gateKeyIdSchema } from "../src/modules/checkin/lib/gate-token";

const kid = process.argv[2] ?? `k${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
if (!gateKeyIdSchema.safeParse(kid).success) {
  console.error("Key id must be 1–32 lowercase letters, digits or hyphens.");
  process.exit(1);
}

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const pkcs8 = privateKey.export({ format: "der", type: "pkcs8" }).toString("base64url");
const spki = publicKey.export({ format: "der", type: "spki" }).toString("base64url");

console.log(`GATE_SIGNING_KEY_ID=${kid}`);
console.log(`GATE_SIGNING_PRIVATE_KEY=${pkcs8}`);
console.log(`# When this key is later retired, append to GATE_RETIRED_PUBLIC_KEYS: ${kid}=${spki}`);
