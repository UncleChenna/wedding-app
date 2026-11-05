import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  signIn: vi.fn(),
  saveParty: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock("../server/request-rate-limit", () => ({ actionRateLimit: mocks.limit }));
vi.mock("../server/db/client", () => ({ db: {} }));
vi.mock("../server/staff-auth", async () => {
  const { z } = await import("zod");
  return { staffRoleSchema: z.enum(["gate", "kitchen", "bar"]), signInStaff: mocks.signIn };
});
vi.mock("../server/staff-cookies", () => ({
  staffSigningKey: () => Buffer.alloc(32, 1),
  staffCookieOptions: {},
  STAFF_DEVICE_COOKIE: "device",
  STAFF_SESSION_COOKIE: "session",
}));
vi.mock("../../invitations/server/party", () => ({ saveParty: mocks.saveParty }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }));
import { staffSignInAction } from "../server/staff-actions";
import { updateParty } from "../../invitations/server/party-actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({
    status: "limited",
    retryAfterSeconds: 60,
    message: "Please wait a minute.",
  });
});

it("denies PIN verification before creating or consulting a device cookie", async () => {
  const form = new FormData();
  form.set("role", "gate");
  form.set("pin", "012345");
  expect(await staffSignInAction({ status: "idle", message: "" }, form)).toEqual({
    status: "locked",
    message: "Please wait a minute.",
  });
  expect(mocks.cookies).not.toHaveBeenCalled();
  expect(mocks.signIn).not.toHaveBeenCalled();
  expect(mocks.limit).toHaveBeenCalledWith("pin");
});

it("denies party updates before reading an invitation", async () => {
  const form = new FormData();
  form.set("token", "a".repeat(43));
  form.set("people", "[]");
  expect(await updateParty({ status: "idle", message: "" }, form)).toEqual({
    status: "error",
    message: "Please wait a minute.",
  });
  expect(mocks.saveParty).not.toHaveBeenCalled();
});
