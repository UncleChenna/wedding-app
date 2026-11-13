import { describe, expect, it } from "vitest";
import { isLocalSignInCode, localSignInCode } from "../lib/local-sign-in";

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
});
