import { generateKeyPairSync } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseServerEnv } from "../../src/modules/shared/lib/env/schema";
import { applicationEnvironmentNames, validateReleaseEnvironment } from "../release-environment";

function valid() {
  const { privateKey } = generateKeyPairSync("ed25519");
  return {
    NODE_ENV: "production" as const,
    DATABASE_URL:
      "postgresql://release:synthetic-password@db.example.com:5432/wedding?sslmode=require",
    NEXT_PUBLIC_SITE_URL: "https://wedding.example.com",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic-release-key",
    ADMIN_EMAIL_ALLOWLIST: "host@example.com",
    STAFF_SESSION_SECRET: "12".repeat(32),
    SUPABASE_JWT_SECRET: "synthetic-realtime-secret-at-least-thirty-two-characters",
    ALERT_DRAIN_SECRET: "34".repeat(32),
    GATE_SIGNING_KEY_ID: "release-1",
    GATE_SIGNING_PRIVATE_KEY: privateKey
      .export({ format: "der", type: "pkcs8" })
      .toString("base64url"),
  };
}

describe("explicit release environment profiles", () => {
  it.each(["preview", "production"] as const)(
    "accepts complete synthetic %s configuration",
    (profile) => {
      expect(validateReleaseEnvironment(valid(), profile)).toEqual([]);
    },
  );

  it("preserves optional local runtime defaults", () => {
    const local = parseServerEnv({ DATABASE_URL: "postgresql://postgres:postgres@localhost/db" });
    expect(local.STAFF_SESSION_SECRET).toBe("");
    expect(local.ALERT_DRAIN_SECRET).toBe("");
    expect(local.ADMIN_EMAIL_ALLOWLIST).toBe("");
  });

  it("reports all missing release capabilities without echoing values", () => {
    const issues = validateReleaseEnvironment({}, "production");
    for (const field of [
      "DATABASE_URL",
      "NEXT_PUBLIC_SITE_URL",
      "ADMIN_EMAIL_ALLOWLIST",
      "STAFF_SESSION_SECRET",
      "SUPABASE_JWT_SECRET",
      "ALERT_DRAIN_SECRET",
      "GATE_SIGNING_PRIVATE_KEY",
    ])
      expect(issues.some((issue) => issue.field === field)).toBe(true);
  });

  it.each([
    "http://wedding.example.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://[::1]",
    "https://10.0.0.1",
    "https://user:private-value@wedding.example.com",
    "https://wedding.example.com/path?private-value",
  ])("rejects unsafe deployment origins: %s", (url) => {
    const issues = validateReleaseEnvironment(
      { ...valid(), NEXT_PUBLIC_SITE_URL: url },
      "production",
    );
    expect(issues.some((issue) => issue.field === "NEXT_PUBLIC_SITE_URL")).toBe(true);
    expect(JSON.stringify(issues)).not.toContain("private-value");
  });

  it("rejects malformed keys, wildcard admins, local databases and private public keys", () => {
    const issues = validateReleaseEnvironment(
      {
        ...valid(),
        DATABASE_URL: "postgresql://u:private-value@localhost/db",
        GATE_SIGNING_PRIVATE_KEY: "private-value",
        ADMIN_EMAIL_ALLOWLIST: "*@example.com",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_private-value",
        NEXT_PUBLIC_UNKNOWN: "private-value",
      },
      "preview",
    );
    for (const field of [
      "DATABASE_URL",
      "GATE_SIGNING_PRIVATE_KEY",
      "ADMIN_EMAIL_ALLOWLIST",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_UNKNOWN",
    ])
      expect(issues.some((issue) => issue.field === field)).toBe(true);
    expect(JSON.stringify(issues)).not.toContain("private-value");
  });

  it.each(["anon", "service_role"])(
    "accepts only the public role in a legacy JWT shape: %s",
    (role) => {
      const token = [
        Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url"),
        Buffer.from(JSON.stringify({ role })).toString("base64url"),
        "synthetic-signature",
      ].join(".");
      const issues = validateReleaseEnvironment(
        { ...valid(), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: token },
        "production",
      );
      expect(issues.some((issue) => issue.field === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")).toBe(
        role !== "anon",
      );
    },
  );

  it("rejects conflicting TLS URL parameters", () => {
    const env = valid();
    for (const suffix of ["&sslmode=disable", "&ssl=false"]) {
      const issues = validateReleaseEnvironment(
        { ...env, DATABASE_URL: env.DATABASE_URL + suffix },
        "production",
      );
      expect(issues.some((issue) => issue.field === "DATABASE_URL")).toBe(true);
    }
  });

  it("rejects transport without required TLS and reused symmetric secrets", () => {
    const env = valid();
    const issues = validateReleaseEnvironment(
      {
        ...env,
        DATABASE_URL: env.DATABASE_URL.replace("sslmode=require", "sslmode=disable"),
        ALERT_DRAIN_SECRET: env.STAFF_SESSION_SECRET,
      },
      "production",
    );
    expect(issues.some((issue) => issue.field === "DATABASE_URL")).toBe(true);
    expect(issues.some((issue) => issue.field === "ALERT_DRAIN_SECRET")).toBe(true);
  });

  it.each(["2130706433", "0x7f000001", "127.000.000.001", "[::ffff:127.0.0.1]"])(
    "rejects local Postgres host aliases: %s",
    (host) => {
      const issues = validateReleaseEnvironment(
        { ...valid(), DATABASE_URL: `postgresql://u:p@${host}/db?sslmode=require` },
        "production",
      );
      expect(issues.some((issue) => issue.field === "DATABASE_URL")).toBe(true);
    },
  );

  it("rejects a mismatched provider scope and malformed retired keys", () => {
    const issues = validateReleaseEnvironment(
      { ...valid(), VERCEL_ENV: "development", GATE_RETIRED_PUBLIC_KEYS: "old=not-a-key" },
      "production",
    );
    expect(issues.some((issue) => issue.field === "VERCEL_ENV")).toBe(true);
    expect(issues.some((issue) => issue.field === "GATE_RETIRED_PUBLIC_KEYS")).toBe(true);
  });

  it("documents every application variable exactly once, excluding runner flags", () => {
    const example = readFileSync(".env.example", "utf8");
    const documented = [...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]);
    expect([...applicationEnvironmentNames].filter((name) => name !== "NODE_ENV").sort()).toEqual(
      documented.sort(),
    );
    const doc = readFileSync("docs/deployment.md", "utf8");
    const rows = [...doc.matchAll(/^\|\s+`([A-Z][A-Z0-9_]*)`\s+\|/gm)].map((match) => match[1]);
    expect(rows.sort()).toEqual([...applicationEnvironmentNames].sort());
  });

  it("runs the explicit command with synthetic values and exits nonzero without leaking secrets", () => {
    const command = resolve("scripts/check-release-environment.ts");
    const loader = resolve("node_modules/tsx/dist/loader.mjs");
    const env = { PATH: process.env.PATH, ...valid() };
    const invoke = (args: string[], values: NodeJS.ProcessEnv) =>
      execFileSync(
        process.execPath,
        ["--conditions=react-server", "--import", loader, command, ...args],
        { env: values, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 10_000 },
      );
    expect(invoke(["--profile", "production"], env)).toContain("configuration shape passed");
    expect(() => invoke([], env)).toThrow(/--profile/);
    try {
      invoke(["--profile", "production"], { ...env, STAFF_SESSION_SECRET: "private-value" });
      throw new Error("expected command failure");
    } catch (error) {
      expect(String(error)).toContain("STAFF_SESSION_SECRET");
      expect(String(error)).not.toContain("private-value");
    }
  });
});
