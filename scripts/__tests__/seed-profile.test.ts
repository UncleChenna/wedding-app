import { describe, expect, it } from "vitest";
import { parseSeedProfile } from "../seed-profile";

describe("seed CLI profile", () => {
  it("accepts only the documented profiles", () => {
    expect(parseSeedProfile([])).toBe("default");
    expect(parseSeedProfile(["--profile", "default"])).toBe("default");
    expect(parseSeedProfile(["--profile", "load"])).toBe("load");
  });
  it.each([["load"], ["--profile"], ["--profile", "production"], ["--profile", "load", "extra"]])(
    "rejects malformed arguments before reset: %j",
    (...args) => {
      expect(() => parseSeedProfile(args)).toThrow("Usage:");
    },
  );
});
