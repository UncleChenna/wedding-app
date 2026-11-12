import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { verificationCommands } from "../ci-verify.mjs";

const root = resolve(import.meta.dirname, "../..");
const workflow = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
const example = readFileSync(resolve(root, ".env.example"), "utf8");

describe("CI parity", () => {
  it("documents each declared CI environment variable in the public example", () => {
    // ci.yml uses uppercase environment keys; application values are assignments,
    // while workflow-only values are documented as comments, not app defaults.
    const variables = [...workflow.matchAll(/^\s+([A-Z][A-Z0-9_]*):/gm)].map((match) => match[1]);
    expect(variables.length).toBeGreaterThanOrEqual(8);
    for (const name of variables) {
      expect(example, `Missing CI variable documentation: ${name}`).toMatch(
        new RegExp(`^(?:# )?${name}[=:]`, "m"),
      );
    }
  });

  it("runs the full local gate and both scanner engines in the verify job", () => {
    const verifyJob = workflow.match(/^  verify:\n([\s\S]*?)(?=^  [a-z][\w-]*:|$(?![\s\S]))/m)?.[1];
    expect(verifyJob).toBeDefined();
    // Include named steps too: their run key has no list marker on the same line.
    const commands = [...(verifyJob ?? "").matchAll(/^\s+(?:- )?run: (.+)$/gm)].map(
      (match) => match[1],
    );
    expect(commands).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm exec playwright install --with-deps chromium webkit",
      "pnpm agents:link && pnpm agents:check",
      "pnpm db:migrate",
      "node scripts/ci-verify.mjs",
    ]);
    expect(verificationCommands({ full: true })).toEqual([
      ["pnpm", "verify"],
      ["pnpm", "test:gate"],
    ]);
    expect(verifyJob).toContain("fetch-depth: 0");
    expect(workflow).toContain("|| 'full verification proof'");
  });
});
