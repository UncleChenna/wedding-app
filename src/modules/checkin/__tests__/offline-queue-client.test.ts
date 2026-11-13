import { beforeEach, expect, it, vi } from "vitest";
import { recordOfflineAttempt } from "../browser/offline-queue-client";
const message = vi.hoisted(() => vi.fn());
vi.mock("../browser/scanner-worker-message", () => ({ scannerWorkerMessage: message }));
const input = {
  session: "a".repeat(64),
  clientEventId: "11111111-1111-4111-8111-111111111111",
  qr: "signed",
  inputMethod: "qr" as const,
  kind: "admission" as const,
  people: 1,
  nameChecked: false,
};
beforeEach(() => message.mockReset());
it("accepts only an acknowledgement for the exact immutable local intent", async () => {
  message.mockResolvedValue({
    state: "recorded",
    clientEventId: "22222222-2222-4222-8222-222222222222",
    result: "valid",
    people: 1,
  });
  expect(await recordOfflineAttempt(input)).toEqual({ state: "unavailable" });
  message.mockResolvedValue({
    state: "recorded",
    clientEventId: input.clientEventId,
    result: "valid",
    people: 1,
  });
  expect(await recordOfflineAttempt(input)).toMatchObject({ state: "recorded" });
  expect(message).toHaveBeenLastCalledWith("RECORD_OFFLINE_ATTEMPT", input.session, input);
});
