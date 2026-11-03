import { expect, it, vi } from "vitest";
import { invitationPdfResponse } from "../server/pdf-response";

const token = "a".repeat(43);
it("rejects malformed credentials and appearance without loading private data", async () => {
  const generate = vi.fn();
  for (const [credential, scheme] of [
    ["bad", "light"],
    [token, "unknown"],
  ]) {
    expect((await invitationPdfResponse(credential, scheme, generate)).status).toBe(404);
  }
  expect(generate).not.toHaveBeenCalled();
});
it("uses a fixed filename and disables all shared caching", async () => {
  const generate = vi
    .fn()
    .mockResolvedValue({ state: "ready", buffer: new TextEncoder().encode("%PDF-test") });
  const response = await invitationPdfResponse(token, "dark", generate);
  expect(generate).toHaveBeenCalledWith(token, "dark");
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("content-disposition")).toBe(
    'attachment; filename="wedding-invitation.pdf"',
  );
  expect(response.headers.get("x-robots-tag")).toContain("noindex");
  expect(await response.text()).toBe("%PDF-test");
});
it.each(["absent", "unavailable"])(
  "does not return a PDF when eligibility is %s",
  async (state) => {
    const response = await invitationPdfResponse(token, null, async () => ({
      state: state as "absent" | "unavailable",
    }));
    expect(response.status).toBe(state === "absent" ? 404 : 503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).not.toContain(token);
  },
);
it("keeps internal render failures out of the guest response", async () => {
  const response = await invitationPdfResponse(token, null, async () => {
    throw new Error("private database detail");
  });
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("database");
});
