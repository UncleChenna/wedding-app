import { expect, it, vi } from "vitest";
import { admissionResponse } from "../server/admission-response";
const actor = { staffId: "gate", deviceId: "scanner", credentialVersion: 1 };
const input = {
  clientEventId: "550e8400-e29b-41d4-a716-446655440000",
  qr: "signed pass",
  people: 2,
};
const request = (body: unknown, origin = "https://wedding.example") =>
  new Request("https://wedding.example/api/checkin/admit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
it("requires live gate authorization before parsing or writing", async () => {
  const submit = vi.fn();
  const response = await admissionResponse(request(input), { authorize: async () => null, submit });
  expect(response.status).toBe(403);
  expect(submit).not.toHaveBeenCalled();
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it("rejects cross-origin and malformed requests without a write", async () => {
  const submit = vi.fn();
  for (const value of [
    request(input, "https://evil.example"),
    request({ ...input, staffId: "forged" }),
    request({ ...input, people: 0 }),
  ]) {
    expect((await admissionResponse(value, { authorize: async () => actor, submit })).status).toBe(
      400,
    );
  }
  expect(submit).not.toHaveBeenCalled();
});
it("returns only a committed receipt and does not expose write failures", async () => {
  const receipt = {
    state: "duplicate" as const,
    people: 2,
    recordedAt: "2026-12-19T12:00:00.000Z",
  };
  const response = await admissionResponse(request(input), {
    authorize: async () => actor,
    submit: async (received, identity, origin) => {
      expect(received).toEqual(input);
      expect(identity).toEqual(actor);
      expect(origin).toBe("https://wedding.example");
      return receipt;
    },
  });
  expect(await response.json()).toEqual(receipt);
  const failed = await admissionResponse(request(input), {
    authorize: async () => actor,
    submit: async () => {
      throw new Error("private token/database host");
    },
  });
  expect(failed.status).toBe(503);
  expect(await failed.json()).toEqual({ state: "unavailable" });
});
