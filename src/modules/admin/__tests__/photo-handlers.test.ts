import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ access: vi.fn(), load: vi.fn() }));
vi.mock("../server/current-admin-access", () => ({ currentAdminAccess: mocks.access }));
vi.mock("../server/photo-repository", () => ({ loadPhoto: mocks.load, storePhoto: vi.fn() }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
import { privatePhoto } from "../server/photo-handlers";

const id = "e11e1111-1111-4111-8111-111111111111";
describe("private photo delivery", () => {
  beforeEach(() => {
    mocks.access.mockReset();
    mocks.load.mockReset();
  });
  it.each(["signed-out", "denied", "enroll", "challenge"])(
    "denies %s before querying assets",
    async (status) => {
      mocks.access.mockResolvedValue({ status });
      expect((await privatePhoto(id)).status).toBe(403);
      expect(mocks.load).not.toHaveBeenCalled();
    },
  );
  it("rejects URLs instead of treating them as asset references", async () => {
    mocks.access.mockResolvedValue({ status: "ready" });
    expect((await privatePhoto("https://elsewhere.test/photo.webp")).status).toBe(404);
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it("serves private WebP bytes with nosniff", async () => {
    mocks.access.mockResolvedValue({ status: "ready" });
    mocks.load.mockResolvedValue({ bytes: Buffer.from([1, 2, 3]) });
    const response = await privatePhoto(id);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });
  it("returns 404 for missing assets and safe 503 for storage failures", async () => {
    mocks.access.mockResolvedValue({ status: "ready" });
    mocks.load.mockResolvedValue(null);
    expect((await privatePhoto(id)).status).toBe(404);
    mocks.load.mockRejectedValue(new Error("private database detail"));
    const response = await privatePhoto(id);
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("");
  });
});
