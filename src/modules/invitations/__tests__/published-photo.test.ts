import { beforeEach, expect, it, vi } from "vitest";
const read = vi.hoisted(() => vi.fn());
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/invitation-design", () => ({
  readPublishedInvitationPhoto: read,
}));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
import { publishedPhotoResponse } from "../server/published-photo";
const id = "9cd42a82-e3cf-4ce5-9d02-8787552e80af";
beforeEach(() => vi.resetAllMocks());
it("rejects malformed identifiers before storage access", async () => {
  expect((await publishedPhotoResponse("../private")).status).toBe(404);
  expect(read).not.toHaveBeenCalled();
});
it("does not serve or cache an unpublished photo", async () => {
  read.mockResolvedValue(null);
  const response = await publishedPhotoResponse(id);
  expect(response.status).toBe(404);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("serves only the selected bytes with explicit image and cache headers", async () => {
  read.mockResolvedValue({ bytes: Buffer.from([1, 2, 3]) });
  const response = await publishedPhotoResponse(id);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/webp");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("cache-control")).toContain("max-age=300");
  expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1, 2, 3]);
});
it("keeps failed reads generic and uncached", async () => {
  read.mockRejectedValue(new Error("private connection"));
  const response = await publishedPhotoResponse(id);
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).toBe("");
});
