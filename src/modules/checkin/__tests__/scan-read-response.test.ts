import { expect, it, vi } from "vitest";
import { scanReadResponse } from "../server/scan-read-response";
const request = (body: unknown) =>
  new Request("https://wedding.example/api/checkin/read", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", Origin: "https://wedding.example" },
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
      new Request("https://wedding.example/api/checkin/read", {
        method: "POST",
        body,
        headers: { Origin: "https://wedding.example" },
      }),
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
it("rejects missing or foreign origins before writing authenticated evidence", async () => {
  const read = vi.fn();
  for (const origin of [null, "https://other.example"]) {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (origin) headers.set("Origin", origin);
    const response = await scanReadResponse(
      new Request("https://wedding.example/api/checkin/read", {
        method: "POST",
        headers,
        body: JSON.stringify({ qr: "value" }),
      }),
      { authorize: async () => true, read },
    );
    expect(response.status).toBe(403);
  }
  expect(read).not.toHaveBeenCalled();
});
it("bounds untrusted browser time and excludes fabricated actor or manual source", async () => {
  const read = vi.fn(async () => ({ state: "invalid" as const }));
  for (const extra of [
    { reportedAt: new Date(Date.now() - 86_400_001).toISOString() },
    { reportedAt: new Date(Date.now() + 600_000).toISOString() },
    { reportedAt: "not a date" },
    { staffId: "forged" },
    { inputMethod: "manual" },
    { source: "offline" },
  ])
    expect(
      (
        await scanReadResponse(request({ qr: "x", ...extra }), {
          authorize: async () => true,
          read,
        })
      ).status,
    ).toBe(400);
  expect(read).not.toHaveBeenCalled();
  const observed = new Date(Date.now() - 1_000);
  expect(
    (
      await scanReadResponse(request({ qr: "x", reportedAt: observed.toISOString() }), {
        authorize: async () => true,
        read,
      })
    ).status,
  ).toBe(200);
  expect(read).toHaveBeenCalledWith("x", "https://wedding.example", observed);
});
