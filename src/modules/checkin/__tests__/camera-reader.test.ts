// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cameraProblem, startQrCamera } from "../lib/camera-reader";

function fixture() {
  const video = document.createElement("video");
  Object.defineProperty(video, "readyState", { value: 4 });
  video.play = vi.fn().mockResolvedValue(undefined);
  const stop = vi.fn();
  const applyConstraints = vi.fn().mockResolvedValue(undefined);
  const track = Object.assign(new EventTarget(), {
    stop,
    applyConstraints,
    getCapabilities: () => ({ torch: true }),
  });
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  const controller = new AbortController();
  const onCode = vi.fn();
  const onProblem = vi.fn();
  const onTorchAvailable = vi.fn();
  return {
    video,
    stop,
    track,
    applyConstraints,
    stream,
    getUserMedia,
    controller,
    options: { video, signal: controller.signal, onCode, onProblem, onTorchAvailable },
    onCode,
    onProblem,
    onTorchAvailable,
  };
}
afterEach(() => {
  vi.useRealTimers();
});
it("decodes serially, suppresses repeated reads and releases the camera on abort", async () => {
  vi.useFakeTimers();
  const f = fixture();
  const readFrame = vi.fn().mockResolvedValue(["a"]);
  await startQrCamera({ ...f.options, readFrame });
  await vi.advanceTimersByTimeAsync(600);
  expect(f.onCode).toHaveBeenCalledTimes(1);
  expect(f.onTorchAvailable).toHaveBeenCalledWith(true);
  f.controller.abort();
  const calls = readFrame.mock.calls.length;
  await vi.advanceTimersByTimeAsync(5000);
  expect(readFrame).toHaveBeenCalledTimes(calls);
  expect(f.stop).toHaveBeenCalled();
  expect(f.video.srcObject).toBeNull();
});
it("releases a late permission grant after cancellation without starting video", async () => {
  const f = fixture();
  let grant: ((stream: typeof f.stream) => void) | undefined;
  f.getUserMedia.mockImplementation(
    () =>
      new Promise((resolve) => {
        grant = resolve;
      }),
  );
  const pending = startQrCamera({ ...f.options, readFrame: async () => [] });
  f.controller.abort();
  grant?.(f.stream);
  await pending;
  expect(f.stop).toHaveBeenCalled();
  expect(f.video.play).not.toHaveBeenCalled();
  expect(f.onProblem).not.toHaveBeenCalled();
});
it("reports denied permission without decoding", async () => {
  const f = fixture();
  f.getUserMedia.mockRejectedValue(new DOMException("private detail", "NotAllowedError"));
  const readFrame = vi.fn();
  await startQrCamera({ ...f.options, readFrame });
  expect(f.onProblem).toHaveBeenCalledWith("denied");
  expect(readFrame).not.toHaveBeenCalled();
});
it("does not deliver an in-flight decoded result after abort", async () => {
  const f = fixture();
  let resolve: ((codes: string[]) => void) | undefined;
  await startQrCamera({
    ...f.options,
    readFrame: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  f.controller.abort();
  resolve?.(["private code"]);
  await Promise.resolve();
  expect(f.onCode).not.toHaveBeenCalled();
});
it("torch failure is recoverable, while a disconnected camera stops the stream", async () => {
  const f = fixture();
  const controls = await startQrCamera({ ...f.options, readFrame: async () => [] });
  expect(await controls.setTorch(true)).toBe(true);
  f.applyConstraints.mockRejectedValue(new Error("unsupported"));
  expect(await controls.setTorch(false)).toBe(false);
  f.track.dispatchEvent(new Event("ended"));
  expect(f.onProblem).toHaveBeenCalledWith("missing");
  expect(f.stop).toHaveBeenCalled();
  expect(await controls.setTorch(true)).toBe(false);
});
it.each([
  ["SecurityError", "denied"],
  ["NotFoundError", "missing"],
  ["OverconstrainedError", "missing"],
  ["NotReadableError", "busy"],
  ["AbortError", "busy"],
  ["UnknownError", "failed"],
])("maps %s to safe recovery copy", (name, result) => {
  expect(cameraProblem(new DOMException("private message", name))).toBe(result);
});
it("stops dispatching a multi-code frame when its first result aborts the camera", async () => {
  const f = fixture();
  f.onCode.mockImplementation(() => f.controller.abort());
  await startQrCamera({ ...f.options, readFrame: async () => ["a", "b"] });
  await Promise.resolve();
  expect(f.onCode.mock.calls).toEqual([["a"]]);
});
it("does not report a pending torch change as successful after shutdown", async () => {
  const f = fixture();
  const controls = await startQrCamera({ ...f.options, readFrame: async () => [] });
  let finish: (() => void) | undefined;
  f.applyConstraints.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const result = controls.setTorch(true);
  f.controller.abort();
  finish?.();
  expect(await result).toBe(false);
});
