import { beforeEach, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({
  whatsApp: vi.fn(),
  push: vi.fn(),
  whatsAppConfig: vi.fn(),
  pushConfig: vi.fn(),
}));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/env", () => ({
  serverEnv: { ALERT_DRAIN_SECRET: "a".repeat(64) },
}));
vi.mock("../server/whatsapp-drain", () => ({ drainWhatsAppAlerts: calls.whatsApp }));
vi.mock("../server/whatsapp-config", () => ({ whatsAppConfig: calls.whatsAppConfig }));
vi.mock("../server/staff-push-outbox", () => ({ drainStaffPush: calls.push }));
vi.mock("../server/staff-push-config", () => ({ staffPushConfig: calls.pushConfig }));
vi.mock("../server/staff-push-send", () => ({ sendStaffPush: vi.fn() }));
import { alertDrainResponse } from "../server/alert-drain-request";

const drain = () =>
  alertDrainResponse(
    new Request("https://wedding.example/api/alerts/drain", {
      method: "POST",
      headers: { authorization: `Bearer ${"a".repeat(64)}` },
    }),
  );

beforeEach(() => {
  vi.resetAllMocks();
  calls.whatsAppConfig.mockReturnValue({ phoneNumberId: "configured" });
  calls.pushConfig.mockReturnValue({ publicKey: "configured" });
});

it("still drains push when the other channel fails", async () => {
  calls.whatsApp.mockRejectedValue(new Error("database connection"));
  calls.push.mockResolvedValue({ sent: 1, failed: 0 });
  const response = await drain();
  expect(calls.push).toHaveBeenCalledOnce();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "unavailable" });
});

it("drains push without touching WhatsApp alerts when WhatsApp isn't configured", async () => {
  calls.whatsAppConfig.mockReturnValue(null);
  calls.push.mockResolvedValue({ sent: 1, failed: 0 });
  const response = await drain();
  expect(calls.whatsApp).not.toHaveBeenCalled();
  expect(calls.push).toHaveBeenCalledOnce();
  expect(response.status).toBe(200);
});

it("drains nothing when neither channel is configured", async () => {
  calls.whatsAppConfig.mockReturnValue(null);
  calls.pushConfig.mockReturnValue(null);
  const response = await drain();
  expect(calls.whatsApp).not.toHaveBeenCalled();
  expect(calls.push).not.toHaveBeenCalled();
  expect(response.status).toBe(503);
});
