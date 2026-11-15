import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * TICKET-261: when the local code cannot complete, the server log says which local setting or
 * service to fix, instead of the sign-in failing as an ordinary wrong code with no clue why.
 */
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3000" }),
}));
const env = vi.hoisted(() => ({ SUPABASE_JWT_SECRET: "x".repeat(40) }));
vi.mock("../server/env", () => ({ serverEnv: env }));
vi.mock("../lib/env/client", () => ({
  clientEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
  },
}));
const execute = vi.hoisted(() => vi.fn());
vi.mock("../server/db/client", () => ({ db: { execute } }));

import {
  localAuthenticatorCode,
  localEmailCode,
  usesLocalSignInCode,
} from "../server/local-sign-in";

let warnings: string[];
beforeEach(() => {
  warnings = [];
  vi.spyOn(console, "warn").mockImplementation((line: string) => void warnings.push(line));
  vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("VERCEL_ENV", "");
  env.SUPABASE_JWT_SECRET = "x".repeat(40);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const logged = () => warnings.join("\n");

describe("local sign-in diagnostics", () => {
  it("says why 000000 was ignored", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:hunter2@db.example.co:5432/postgres");
    expect(await usesLocalSignInCode("000000")).toBe(false);
    expect(logged()).toContain("DATABASE_URL is not a database on this machine");
    expect(logged()).not.toContain("hunter2");
  });

  it("stays quiet for ordinary codes and on Vercel", async () => {
    expect(await usesLocalSignInCode("123456")).toBe(false);
    vi.stubEnv("VERCEL", "1");
    expect(await usesLocalSignInCode("000000")).toBe(false);
    expect(warnings).toEqual([]);
  });

  it("reports a missing secret", async () => {
    env.SUPABASE_JWT_SECRET = "";
    expect(await localEmailCode("probe@example.test")).toBeNull();
    expect(logged()).toContain("SUPABASE_JWT_SECRET is empty");
  });

  it("reports a secret that local Supabase rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 401 })),
    );
    expect(await localEmailCode("probe@example.test")).toBeNull();
    expect(logged()).toContain("SUPABASE_JWT_SECRET does not match local Supabase");
  });

  it("reports local Supabase being down, without the address or secret", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect ECONNREFUSED");
      }),
    );
    expect(await localEmailCode("probe@example.test")).toBeNull();
    expect(logged()).toContain("local Supabase Auth is unreachable");
    expect(logged()).not.toContain("probe@example.test");
    expect(logged()).not.toContain("x".repeat(40));
  });

  it("returns the issued code when everything is in place", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ properties: { email_otp: "482913" } })),
    );
    expect(await localEmailCode("probe@example.test")).toBe("482913");
    expect(warnings).toEqual([]);
  });

  it("points at the database when the authenticator lookup fails", async () => {
    execute.mockRejectedValueOnce(new Error('relation "auth.mfa_factors" password=hunter2'));
    expect(await localAuthenticatorCode("00000000-0000-0000-0000-000000000000")).toBeNull();
    expect(logged()).toContain("pnpm db:migrate");
    expect(logged()).not.toContain("hunter2");
  });
});
