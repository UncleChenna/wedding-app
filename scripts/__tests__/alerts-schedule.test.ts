import { describe, expect, it } from "vitest";
import { parseScheduleArgs } from "../alerts-schedule";

const secret = "a".repeat(64);
const url = "https://wedding.example/api/alerts/drain";

describe("alerts:schedule arguments", () => {
  it("needs the drain URL and a 64-hex secret", () => {
    expect(parseScheduleArgs(["--url", url], { ALERT_DRAIN_SECRET: secret })).toEqual({
      action: "schedule",
      url,
      secret,
    });
    expect(() =>
      parseScheduleArgs(["--url", "https://wedding.example/elsewhere"], {
        ALERT_DRAIN_SECRET: secret,
      }),
    ).toThrow(/api\/alerts\/drain/);
    expect(() => parseScheduleArgs(["--url", url], { ALERT_DRAIN_SECRET: "short" })).toThrow(
      /64 lowercase hex/,
    );
    expect(() =>
      parseScheduleArgs(["--url", "ftp://x/api/alerts/drain"], { ALERT_DRAIN_SECRET: secret }),
    ).toThrow();
  });
  it("removes the job without needing the secret", () => {
    expect(parseScheduleArgs(["--remove"], {})).toEqual({ action: "remove" });
  });
});
