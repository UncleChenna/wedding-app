import { generateKeyPairSync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

/**
 * Guest-page visual regression (TICKET-135). Baselines live next to the spec as
 * `*-regression-linux.png` and are only ever made on CI's Linux runner:
 * - A run that had to write a missing baseline fails and lists it; CI uploads the new images as
 *   the `visual-baselines` artifact for review and commit.
 * - Any other run compares against the committed baselines and fails on a difference.
 */
const pair = generateKeyPairSync("ed25519");
const run = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "--project=regression",
    "--update-snapshots=missing",
    "--workers=2",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_VISUAL_REGRESSION: "1",
      STAFF_SESSION_SECRET: process.env.STAFF_SESSION_SECRET || randomBytes(32).toString("hex"),
      GATE_SIGNING_KEY_ID: "visual-regression",
      GATE_SIGNING_PRIVATE_KEY: pair.privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    },
  },
);
if (run.status !== 0) process.exit(run.status ?? 1);

const created = spawnSync("git", ["ls-files", "--others", "--exclude-standard", "e2e/regression"], {
  encoding: "utf8",
}).stdout.trim();
if (created) {
  console.error(
    `New visual baselines were written. Review and commit them (CI artifact "visual-baselines"):\n${created}`,
  );
  process.exit(1);
}
