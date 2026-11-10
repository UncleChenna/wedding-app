import { expect, it } from "vitest";
import { scanResultPresentation } from "../lib/scan-result";

it("calls a valid read a pass check, never a recorded admission", () => {
  const result = scanResultPresentation("valid");
  expect(result.title).toBe("Valid pass");
  expect(result.description).toContain("No admission has been recorded");
  expect(result.tone).toBe("success");
});
it.each([
  ["already_used", "warning", "Already used"],
  ["invalid", "danger", "Invalid pass"],
  ["revoked", "danger", "Revoked pass"],
  ["replaced", "danger", "Replaced pass"],
  ["not_rsvped", "warning", "Not RSVP’d"],
  ["unknown", "warning", "Not on this device’s list yet"],
  ["unavailable", "warning", "Unable to check this pass"],
  ["session_expired", "warning", "Sign in again"],
] as const)("keeps %s distinct and actionable", (state, tone, title) => {
  const result = scanResultPresentation(state);
  expect(result).toMatchObject({ tone, title });
  expect(result.description.length).toBeGreaterThan(20);
});
