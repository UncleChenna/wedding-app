import { describe, expect, it } from "vitest";
import { assessLighthouse } from "../lighthouse-gate";
const url = "http://localhost:3100/order";
const report = (performance = 0.95, accessibility = 0.95) => ({
  lighthouseVersion: "13.6.0",
  configSettings: { formFactor: "mobile", throttlingMethod: "simulate" },
  finalDisplayedUrl: url,
  categories: { performance: { score: performance }, accessibility: { score: accessibility } },
  audits: { "http-status-code": { score: 1 } },
});
describe("guest Lighthouse release thresholds", () => {
  it("accepts exactly95 and records every cold run", () => {
    expect(assessLighthouse([report(), report(), report()], url)).toMatchObject({
      passed: true,
      performance: [0.95, 0.95, 0.95],
    });
  });
  it("fails median performance below95 without rounding", () => {
    expect(assessLighthouse([report(0.949), report(0.94), report(1)], url).passed).toBe(false);
  });
  it("fails any accessibility run below95", () => {
    expect(assessLighthouse([report(), report(1, 0.94), report()], url).passed).toBe(false);
  });
  it("rejects a desktop profile or HTTP error even with high scores", () => {
    expect(() =>
      assessLighthouse(
        [
          report(),
          report(),
          { ...report(), configSettings: { formFactor: "desktop", throttlingMethod: "simulate" } },
        ],
        url,
      ),
    ).toThrow();
    expect(() =>
      assessLighthouse(
        [report(), report(), { ...report(), audits: { "http-status-code": { score: 0 } } }],
        url,
      ),
    ).toThrow();
  });
  it("rejects missing runs, null scores, errors and successful redirects", () => {
    expect(() => assessLighthouse([report()], url)).toThrow();
    expect(() =>
      assessLighthouse(
        [report(), report(), { ...report(), runtimeError: { code: "FAILED" } }],
        url,
      ),
    ).toThrow();
    expect(() =>
      assessLighthouse(
        [report(), report(), { ...report(), finalDisplayedUrl: url + "/login" }],
        url,
      ),
    ).toThrow();
    expect(() =>
      assessLighthouse(
        [report(), report(), { ...report(), categories: { performance: { score: null } } }],
        url,
      ),
    ).toThrow();
  });
});
