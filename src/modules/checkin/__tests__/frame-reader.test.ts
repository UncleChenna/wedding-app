// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { createFrameReader } from "../lib/camera-reader";
const { decode } = vi.hoisted(() => ({ decode: vi.fn() }));
vi.mock("@zxing/browser", () => ({
  BrowserQRCodeReader: class {
    decode = decode;
  },
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.useRealTimers();
});
function native(detect: () => Promise<{ rawValue: string }[]>) {
  vi.stubGlobal(
    "BarcodeDetector",
    class {
      static getSupportedFormats = async () => ["qr_code"];
      detect = detect;
    },
  );
}
it("uses a native QR result without loading a fallback frame", async () => {
  native(async () => [{ rawValue: "native-code" }]);
  const read = await createFrameReader();
  expect(await read(document.createElement("video"))).toEqual(["native-code"]);
  expect(decode).not.toHaveBeenCalled();
});
it.each(["empty", "error", "absent"])("uses fallback for %s native detection", async (mode) => {
  if (mode === "absent") vi.stubGlobal("BarcodeDetector", undefined);
  else
    native(async () => {
      if (mode === "error") throw new Error("unsupported");
      return [];
    });
  decode.mockReturnValue({ getText: () => "fallback-code" });
  const read = await createFrameReader();
  expect(await read(document.createElement("video"))).toEqual(["fallback-code"]);
});
it("abandons a stalled native detector after its bounded budget", async () => {
  vi.useFakeTimers();
  const detect = vi.fn(() => new Promise<{ rawValue: string }[]>(() => {}));
  native(detect);
  decode.mockReturnValue({ getText: () => "fallback-code" });
  const read = await createFrameReader();
  const result = read(document.createElement("video"));
  await vi.advanceTimersByTimeAsync(200);
  expect(await result).toEqual(["fallback-code"]);
  await read(document.createElement("video"));
  expect(detect).toHaveBeenCalledTimes(1);
});
it.each(["NotFoundException", "ChecksumException", "FormatException"])(
  "tolerates a %s frame",
  async (kind) => {
    vi.stubGlobal("BarcodeDetector", undefined);
    decode.mockImplementation(() => {
      throw { getKind: () => kind };
    });
    const read = await createFrameReader();
    expect(await read(document.createElement("video"))).toEqual([]);
  },
);
it("propagates unexpected fallback failures to camera recovery", async () => {
  vi.stubGlobal("BarcodeDetector", undefined);
  decode.mockImplementation(() => {
    throw new Error("decode failure");
  });
  const read = await createFrameReader();
  await expect(read(document.createElement("video"))).rejects.toThrow("decode failure");
});
