import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { photoUploadResponse } from "../server/photo-upload";
import type { AdminAccess } from "../server/admin-access";

const ready: AdminAccess = { status: "ready", userId: "admin", factors: [] };
function request(body: Uint8Array, extra: Record<string, string> = {}) {
  return new Request("https://wedding.test/api/admin/photos", {
    method: "POST",
    headers: { origin: "https://wedding.test", "content-type": "image/png", ...extra },
    body: Buffer.from(body),
  });
}
const photo = () =>
  sharp({ create: { width: 80, height: 40, channels: 3, background: "ivory" } })
    .png()
    .toBuffer();

describe("photo upload boundary", () => {
  it.each(["signed-out", "denied", "enroll", "challenge"] as const)(
    "rejects %s before reading bytes or storing",
    async (status) => {
      const input = request(new Uint8Array([1]));
      const store = vi.fn();
      const access = { status, userId: "admin", factors: [] } as AdminAccess;
      expect((await photoUploadResponse(input, async () => access, store)).status).toBe(403);
      expect(input.bodyUsed).toBe(false);
      expect(store).not.toHaveBeenCalled();
    },
  );
  it("rejects cross-origin uploads before reading bytes", async () => {
    const input = request(await photo(), { origin: "https://elsewhere.test" });
    const store = vi.fn();
    expect((await photoUploadResponse(input, async () => ready, store)).status).toBe(403);
    expect(input.bodyUsed).toBe(false);
    expect(store).not.toHaveBeenCalled();
  });
  it("rejects URL/JSON inputs without invoking storage", async () => {
    const store = vi.fn();
    const input = request(Buffer.from('{"url":"https://elsewhere.test/photo.png"}'), {
      "content-type": "application/json",
    });
    expect((await photoUploadResponse(input, async () => ready, store)).status).toBe(415);
    expect(store).not.toHaveBeenCalled();
  });
  it("enforces actual streamed size even with a false content length", async () => {
    const store = vi.fn();
    const input = request(new Uint8Array(8 * 1024 * 1024 + 1), { "content-length": "1" });
    expect((await photoUploadResponse(input, async () => ready, store)).status).toBe(413);
    expect(store).not.toHaveBeenCalled();
  });
  it("stores canonical pixels and returns only the controlled reference", async () => {
    const id = "e11e1111-1111-4111-8111-111111111111";
    const store = vi.fn(async () => id);
    const response = await photoUploadResponse(request(await photo()), async () => ready, store);
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const result = await response.json();
    expect(result).toMatchObject({ id, mime: "image/webp", width: 80, height: 40 });
    expect(result.bytes).toBeUndefined();
    expect(result.url).toBeUndefined();
    expect(store).toHaveBeenCalledWith(
      expect.objectContaining({ bytes: expect.any(Buffer), mime: "image/webp" }),
      "admin",
    );
  });
  it("returns a safe error when storage fails", async () => {
    const response = await photoUploadResponse(
      request(await photo()),
      async () => ready,
      async () => {
        throw new Error("private database address");
      },
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private database address");
  });
  it("reports a full store without returning an asset", async () => {
    const response = await photoUploadResponse(
      request(await photo()),
      async () => ready,
      async () => null,
    );
    expect(response.status).toBe(409);
  });
});
