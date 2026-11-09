import { expect, it, vi } from "vitest";
import { scanReadResponse } from "../server/scan-read-response";
const request = (body: unknown) =>
  new Request("https://wedding.example/api/checkin/read", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
it("checks live gate authorization before parsing a scanned value or loading a guest", async () => {
  const read = vi.fn();
  const response = await scanReadResponse(request({ qr: "private pass" }), {
    authorize: async () => false,
    read,
  });
  expect(response.status).toBe(403);
  expect(read).not.toHaveBeenCalled();
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it("rejects malformed and oversized bodies without resolving a pass", async () => {
  const read = vi.fn();
  for (const body of [{ qr: 3 }, { qr: "x".repeat(4097) }, { qr: "", email: "private" }]) {
    expect(
      (await scanReadResponse(request(body), { authorize: async () => true, read })).status,
    ).toBe(400);
  }
  expect(read).not.toHaveBeenCalled();
});
it("returns a read-only result with no store headers", async () => {
  const response = await scanReadResponse(request({ qr: "https://wedding.example/p/token" }), {
    authorize: async () => true,
    read: async (qr, origin) => {
      expect(qr).toBe("https://wedding.example/p/token");
      expect(origin).toBe("https://wedding.example");
      return { state: "invalid" };
    },
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ state: "invalid" });
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
});
it("rejects malformed JSON and the byte-size limit before guest lookup", async () => {
  const read = vi.fn();
  for (const body of ["not json", " ".repeat(8193)]) {
    const response = await scanReadResponse(
      new Request("https://wedding.example/api/checkin/read", { method: "POST", body }),
      { authorize: async () => true, read },
    );
    expect(response.status).toBe(400);
  }
  expect(read).not.toHaveBeenCalled();
});
it("hides read failures and does not relabel unavailable storage as an invalid guest", async () => {
  const response = await scanReadResponse(request({ qr: "private" }), {
    authorize: async () => true,
    read: async () => {
      throw new Error("secret token / database host");
    },
  });
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ state: "unavailable" });
});
