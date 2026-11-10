import { expect, it, vi } from "vitest";
import { requestScanFeedback } from "../lib/scan-feedback";

it("requests both channels without waiting for audio permission", () => {
  const play = vi.fn(() => new Promise<void>(() => {}));
  const vibrate = vi.fn(() => true);
  expect(requestScanFeedback({ play, vibrate })).toBeUndefined();
  expect(play).toHaveBeenCalledOnce();
  expect(vibrate).toHaveBeenCalledWith(80);
});
it("tolerates missing browser capabilities", () => {
  expect(() => requestScanFeedback({})).not.toThrow();
});
it("still vibrates when audio throws synchronously", () => {
  const vibrate = vi.fn(() => true);
  requestScanFeedback({
    play: () => {
      throw new Error("blocked");
    },
    vibrate,
  });
  expect(vibrate).toHaveBeenCalledOnce();
});
it("contains rejected audio and blocked haptics without rejecting the visual flow", async () => {
  const play = vi.fn(async () => {
    throw new Error("denied");
  });
  expect(() =>
    requestScanFeedback({
      play,
      vibrate: () => {
        throw new Error("disabled");
      },
    }),
  ).not.toThrow();
  await Promise.resolve();
  expect(play).toHaveBeenCalledOnce();
});
it("also accepts synchronous audio and a false vibration result", () => {
  const play = vi.fn();
  const vibrate = vi.fn(() => false);
  requestScanFeedback({ play, vibrate });
  expect(play).toHaveBeenCalledOnce();
  expect(vibrate).toHaveBeenCalledOnce();
});
