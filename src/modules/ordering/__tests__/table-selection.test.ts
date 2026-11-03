import { expect, it, vi } from "vitest";
import { resolveTableSelection } from "../server/table-selection";

it.each(["", "0", "-1", "1.5", "1e2", "3 OR 1=1", "2147483648", null, new Blob(["1"])])(
  "rejects invalid table input before lookup: %s",
  async (value) => {
    const find = vi.fn(async () => null);
    expect((await resolveTableSelection(value, find)).status).toBe("invalid");
    expect(find).not.toHaveBeenCalled();
  },
);
it("normalizes a known number and returns only its selection", async () => {
  const find = vi.fn(async () => ({ id: "table-id", number: 7 }));
  expect(await resolveTableSelection(" 007 ", find)).toEqual({
    status: "selected",
    table: { id: "table-id", number: 7 },
  });
  expect(find).toHaveBeenCalledWith(7);
});
it("rejects unknown or stale selections", async () => {
  expect((await resolveTableSelection("7", async () => null)).status).toBe("missing");
});
it("contains database errors without returning raw details", async () => {
  const result = await resolveTableSelection("7", async () => {
    throw new Error("password=private");
  });
  expect(result.status).toBe("unavailable");
  expect(JSON.stringify(result)).not.toContain("private");
});
