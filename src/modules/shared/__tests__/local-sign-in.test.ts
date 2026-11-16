import { describe, expect, it } from "vitest";
import { isLocalSignInCode, localSignInCode, localSignInRefusal } from "../lib/local-sign-in";

const local = {
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
};

describe("local sign-in code (TICKET-250)", () => {
  it("is 000000 on a fully local setup opened from localhost", () => {
    for (const host of ["localhost:3000", "127.0.0.1:30110", "[::1]:3000"])
      expect(localSignInCode(local, host)).toBe("000000");
    expect(isLocalSignInCode(" 000000 ", local, "localhost:3000")).toBe(true);
    expect(isLocalSignInCode("123456", local, "localhost:3000")).toBe(false);
  });

  it("never works on Vercel, whatever else is set", () => {
    expect(localSignInCode({ ...local, VERCEL: "1" }, "localhost:3000")).toBeNull();
    expect(localSignInCode({ ...local, VERCEL_ENV: "preview" }, "localhost:3000")).toBeNull();
  });

  it("needs the database and Supabase on this machine", () => {
    expect(
      localSignInCode(
        { ...local, DATABASE_URL: "postgresql://u:p@db.example.supabase.co:5432/postgres" },
        "localhost:3000",
      ),
    ).toBeNull();
    expect(
      localSignInCode(
        { ...local, NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" },
        "localhost:3000",
      ),
    ).toBeNull();
    expect(localSignInCode({}, "localhost:3000")).toBeNull();
  });

  it("needs the browser on localhost", () => {
    for (const host of ["wedding.example", "192.168.1.20:3000", "localhost.evil.test", "", null])
      expect(localSignInCode(local, host)).toBeNull();
  });

  it("can be turned off or replaced, but only with six digits", () => {
    expect(localSignInCode({ ...local, LOCAL_SIGN_IN_CODE: "off" }, "localhost")).toBeNull();
    expect(localSignInCode({ ...local, LOCAL_SIGN_IN_CODE: "246810" }, "localhost")).toBe("246810");
    expect(localSignInCode({ ...local, LOCAL_SIGN_IN_CODE: "12ab" }, "localhost")).toBeNull();
    expect(isLocalSignInCode(undefined, local, "localhost")).toBe(false);
  });

  it("names the setting that refuses it, never its value (TICKET-261)", () => {
    expect(localSignInRefusal(local, "localhost:3000")).toBeNull();
    const cases: [Record<string, string>, string | null, string][] = [
      [{ VERCEL: "1" }, "localhost", "running on Vercel"],
      [{ LOCAL_SIGN_IN_CODE: "off" }, "localhost", "LOCAL_SIGN_IN_CODE is off"],
      [{ LOCAL_SIGN_IN_CODE: "12ab" }, "localhost", "LOCAL_SIGN_IN_CODE is not six digits"],
      [
        { DATABASE_URL: "postgresql://u:hunter2@db.example.co:5432/postgres" },
        "localhost",
        "DATABASE_URL is not a database on this machine",
      ],
      [
        { NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" },
        "localhost",
        "NEXT_PUBLIC_SUPABASE_URL is not Supabase on this machine",
      ],
      [{}, "192.168.1.20:3000", "the page was not opened from localhost"],
    ];
    for (const [override, host, reason] of cases) {
      const refusal = localSignInRefusal({ ...local, ...override }, host);
      expect(refusal).toBe(reason);
      expect(refusal).not.toContain("hunter2");
    }
  });
});
