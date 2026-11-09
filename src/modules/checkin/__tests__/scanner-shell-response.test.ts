import { notFound } from "next/navigation";
import { beforeEach, expect, it, vi } from "vitest";
import { getActiveThemes } from "@/modules/theming/lib/registry";
import type { ScannerShellGrant } from "../browser/scanner-shell-store";
import { scannerShellResponse } from "../server/scanner-shell-response";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  assets: vi.fn(),
  cookies: vi.fn(),
  key: vi.fn(),
}));
vi.mock("@/modules/shared/server/staff-cookies", () => ({
  currentStaffDevice: mocks.auth,
  staffSigningKey: mocks.key,
  STAFF_SESSION_COOKIE: "wedding-staff-session",
}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("../server/scanner-assets", () => ({ readScannerAssets: mocks.assets }));
vi.mock("@/modules/shared/server/env", () => ({ serverEnv: { NODE_ENV: "test" } }));
const themes = async () => getActiveThemes();
beforeEach(() => {
  mocks.auth.mockReset().mockResolvedValue({
    expiresAt: new Date(Date.now() + 60_000),
    identity: { staffId: "private-staff", deviceId: "private-device" },
    device: { name: "Private device name" },
  });
  mocks.key.mockReset().mockReturnValue(Buffer.alloc(32, 7));
  mocks.cookies.mockReset().mockResolvedValue({ get: () => ({ value: "PRIVATE_SESSION_COOKIE" }) });
  const script = `/scanner-assets/scanner-${"a".repeat(64)}.js`;
  const stylesheet = `/scanner-assets/scanner-${"b".repeat(64)}.css`;
  mocks.assets.mockReset().mockResolvedValue({
    version: 1,
    build: "c".repeat(64),
    script,
    stylesheet,
    fonts: [],
    assets: [script, stylesheet],
  });
});
it("issues a no-store minimal shell using live gate authorization without names, raw cookies or server actions", async () => {
  const response = await scannerShellResponse(themes);
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(response.headers.get("X-Wedding-Scanner-Shell")).toBe("1");
  const text = await response.text();
  const grant = JSON.parse(text) as ScannerShellGrant;
  expect(mocks.auth).toHaveBeenCalledWith("gate");
  expect(grant.session).toMatch(/^[a-f0-9]{64}$/);
  expect(grant.html).toContain('id="scanner-shell"');
  expect(grant.html).toContain('data-expires-at="');
  expect(grant.html).toContain(grant.assets[0]);
  expect(grant.headers).toContainEqual([
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=()",
  ]);
  for (const forbidden of [
    "PRIVATE_SESSION_COOKIE",
    "private-staff",
    "private-device",
    "Private device name",
    "$ACTION",
    "__next_f",
  ])
    expect(text).not.toContain(forbidden);
});
it("denies missing or expired live authorization without requesting assets", async () => {
  mocks.auth
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ expiresAt: new Date(Date.now() - 1) });
  expect((await scannerShellResponse(themes)).status).toBe(401);
  expect((await scannerShellResponse(themes)).status).toBe(401);
  expect(mocks.assets).not.toHaveBeenCalled();
});
it("does not extend the deadline if it expires while reading themes or assets", async () => {
  const expiry = Date.now() + 5000;
  mocks.auth.mockResolvedValue({ expiresAt: new Date(expiry) });
  const now = vi.spyOn(Date, "now").mockReturnValue(expiry - 1);
  try {
    const response = await scannerShellResponse(async () => {
      now.mockReturnValue(expiry);
      return getActiveThemes();
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("X-Wedding-Scanner-Shell")).toBeNull();
  } finally {
    now.mockRestore();
  }
});
it("returns unavailable rather than a usable grant for absent build assets", async () => {
  mocks.assets.mockResolvedValue(null);
  const response = await scannerShellResponse(themes);
  expect(response.status).toBe(503);
  expect(response.headers.get("X-Wedding-Scanner-Shell")).toBeNull();
});

it("preserves real Next control-flow errors instead of converting them to unavailable", async () => {
  mocks.auth.mockImplementation(async () => notFound());
  await expect(scannerShellResponse(themes)).rejects.toHaveProperty(
    "digest",
    "NEXT_HTTP_ERROR_FALLBACK;404",
  );
});
it("returns a sanitized unavailable response for ordinary backend failures", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  mocks.auth.mockRejectedValue(new Error("PRIVATE_DATABASE_DETAIL"));
  const response = await scannerShellResponse(themes);
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("PRIVATE_DATABASE_DETAIL");
  expect(response.headers.get("Cache-Control")).toContain("no-store");
});
it("denies missing signing material and missing session cookies", async () => {
  mocks.key.mockReturnValueOnce(null);
  expect((await scannerShellResponse(themes)).status).toBe(401);
  mocks.cookies.mockResolvedValue({ get: () => undefined });
  expect((await scannerShellResponse(themes)).status).toBe(401);
  expect(mocks.assets).not.toHaveBeenCalled();
});
