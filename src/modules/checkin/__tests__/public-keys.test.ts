import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";

import { gatePublicKeysResponse } from "../server/public-keys";

function signingEnv() {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  return {
    env: {
      GATE_SIGNING_KEY_ID: "k2026a",
      GATE_SIGNING_PRIVATE_KEY: privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    },
    spki: publicKey.export({ format: "der", type: "spki" }).toString("base64url"),
  };
}

describe("gate public key endpoint", () => {
  it("publishes only the public key ring with a short public cache", async () => {
    const { env, spki } = signingEnv();
    const response = gatePublicKeysResponse(env);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
    const body = await response.text();
    expect(JSON.parse(body)).toEqual({ keys: [{ kid: "k2026a", alg: "Ed25519", spki }] });
    expect(body).not.toContain(env.GATE_SIGNING_PRIVATE_KEY);
  });

  it("returns a generic 503 that is never cached when keys are not configured", async () => {
    const response = gatePublicKeysResponse({});
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Gate keys are not available yet." });
  });
});
