import { describe, expect, it } from "vitest";

import { EnvError, parseClientEnv, parseServerEnv } from "../lib/env/schema";

describe("env schema", () => {
  it("parses a valid server env and applies defaults", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
    });
    expect(env).toEqual({
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
      NODE_ENV: "development",
      LOG_LEVEL: "info",
      ADMIN_EMAIL_ALLOWLIST: "",
    });
  });

  it("fails fast with every problem listed", () => {
    const run = () => parseServerEnv({ DATABASE_URL: "mysql://nope", LOG_LEVEL: "loud" });
    expect(run).toThrow(EnvError);
    expect(run).toThrow(/DATABASE_URL: DATABASE_URL must start with postgres/);
    expect(run).toThrow(/LOG_LEVEL/);
  });

  it("requires every public variable", () => {
    expect(() => parseClientEnv({})).toThrow(
      /NEXT_PUBLIC_SITE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it("documents every variable in .env.example", async () => {
    const { readFileSync } = await import("node:fs");
    const example = readFileSync(".env.example", "utf8");
    const { serverEnvSchema, clientEnvSchema } = await import("../lib/env/schema");
    const keys = [
      ...Object.keys(serverEnvSchema.shape),
      ...Object.keys(clientEnvSchema.shape),
    ].filter((key) => key !== "NODE_ENV");
    for (const key of keys) expect(example).toMatch(new RegExp(`^${key}=`, "m"));
  });
});

it("rejects unapproved public env names without disclosing their values", () => {
  const source = {
    NEXT_PUBLIC_SITE_URL: "https://example.test",
    NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example.test",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-key",
    NEXT_PUBLIC_DATABASE_URL: "sensitive-fixture-value",
  };
  expect(() => parseClientEnv(source)).toThrow(/NEXT_PUBLIC_DATABASE_URL/);
  try {
    parseClientEnv(source);
  } catch (error) {
    expect(String(error)).not.toContain("sensitive-fixture-value");
  }
});
