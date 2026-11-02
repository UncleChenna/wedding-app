import { expect, it } from "vitest";
import { allowDevPreview } from "../lib/preview-access";

it("keeps production previews disabled by default, including on localhost", () => {
  expect(allowDevPreview("production", undefined, "localhost")).toBe(false);
  expect(allowDevPreview("production", "", "localhost")).toBe(false);
});
it("requires an explicit local-only test opt-in", () => {
  expect(allowDevPreview("production", "1", "localhost")).toBe(true);
  expect(allowDevPreview("production", "1", "127.0.0.1")).toBe(true);
  expect(allowDevPreview("production", "1", "[::1]")).toBe(true);
  expect(allowDevPreview("production", "true", "localhost")).toBe(false);
  expect(allowDevPreview("production", "1", "wedding.example")).toBe(false);
  expect(allowDevPreview("production", "1", "localhost.example")).toBe(false);
});
it("allows normal development previews", () => {
  expect(allowDevPreview("development", undefined, "localhost")).toBe(true);
});
