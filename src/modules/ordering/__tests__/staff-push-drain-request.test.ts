import { expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({ alerts: vi.fn(), push: vi.fn() }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/env", () => ({
  serverEnv: { ALERT_DRAIN_SECRET: "a".repeat(64) },
}));
vi.mock("../server/alert-outbox", () => ({ drainOrderAlerts: calls.alerts }));
vi.mock("../server/staff-push-outbox", () => ({ drainStaffPush: calls.push }));
vi.mock("../server/staff-push-config", () => ({
  staffPushConfig: () => ({ publicKey: "configured" }),
}));
vi.mock("../server/staff-push-send", () => ({ sendStaffPush: vi.fn() }));
import { alertDrainResponse } from "../server/alert-drain-request";

it("still drains push when the other channel fails", async () => {
  calls.alerts.mockRejectedValue(new Error("database connection"));
  calls.push.mockResolvedValue({ sent: 1, failed: 0 });
  const response = await alertDrainResponse(
    new Request("https://wedding.example/api/alerts/drain", {
      method: "POST",
      headers: { authorization: `Bearer ${"a".repeat(64)}` },
    }),
  );
  expect(calls.push).toHaveBeenCalledOnce();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "unavailable" });
});
