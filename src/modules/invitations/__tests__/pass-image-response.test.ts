import { expect, it, vi } from "vitest";
import { passImageResponse } from "../server/pass-image-response";
import { getTheme } from "@/modules/theming";
import type { IssuedGatePass } from "@/modules/checkin/server/issue-pass";

function setup(
  state: IssuedGatePass = {
    state: "ready",
    url: "https://example.com/p/read-only",
    pass: { names: ["Ada"], householdName: null, partySize: 2, tableNumber: 77 },
  },
) {
  return {
    identify: vi.fn(async () => ({ id: "id", tokenVersion: 1 })),
    issue: vi.fn(async () => state),
    theme: vi.fn(async () => getTheme("ivory-gold")),
    render: vi.fn(async () => new Response("image")),
  };
}
it("does not issue or render for an invalid, unknown or revoked identity", async () => {
  const deps = { ...setup(), identify: vi.fn(async () => null) };
  const result = await passImageResponse("private-credential", deps);
  expect(result.status).toBe(404);
  expect(result.headers.get("cache-control")).toContain("no-store");
  expect(deps.issue).not.toHaveBeenCalled();
  expect(deps.render).not.toHaveBeenCalled();
});
it.each(["absent", "unavailable"] as const)(
  "does not render when issuance is %s",
  async (state) => {
    const deps = setup({ state });
    expect((await passImageResponse("private-credential", deps)).status).toBe(
      state === "absent" ? 404 : 503,
    );
    expect(deps.render).not.toHaveBeenCalled();
  },
);
it("passes only name, count and read-only QR URL into the renderer", async () => {
  const deps = setup();
  await passImageResponse("private-credential", deps);
  expect(deps.render).toHaveBeenCalledWith(
    { name: "Ada", partySize: 2, url: "https://example.com/p/read-only" },
    getTheme("ivory-gold"),
  );
});
it("contains rendering failure without leaking a name or credential", async () => {
  const deps = {
    ...setup(),
    render: vi.fn(async () => {
      throw new Error("private-credential Ada");
    }),
  };
  const result = await passImageResponse("private-credential", deps);
  expect(result.status).toBe(503);
  expect(await result.text()).not.toMatch(/private-credential|Ada/);
});
