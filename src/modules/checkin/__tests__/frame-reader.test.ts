// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { createFrameReader } from "../lib/camera-reader";
const { decode, decodeFromCanvas } = vi.hoisted(() => ({
  decode: vi.fn(),
  decodeFromCanvas: vi.fn(),
}));
vi.mock("@zxing/browser", () => ({
  BrowserQRCodeReader: class {
    decode = decode;
    decodeFromCanvas = decodeFromCanvas;
  },
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
function sizedVideo(width: number, height: number) {
  const video = document.createElement("video");
  Object.defineProperties(video, { videoWidth: { value: width }, videoHeight: { value: height } });
  return video;
}
it("retries one smaller copy of a not-found frame and reuses the bounded canvas", async () => {
  vi.stubGlobal("BarcodeDetector", undefined);
  decode.mockImplementation(() => {
    throw { name: "NotFoundException" };
  });
  decodeFromCanvas.mockReturnValue({ getText: () => "recovered" });
  const drawing = { drawImage: vi.fn(), setTransform: vi.fn(), imageSmoothingEnabled: true };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    drawing as unknown as CanvasRenderingContext2D,
  );
  const video = sizedVideo(512, 512);
  const read = await createFrameReader();
  expect(await read(video)).toEqual(["recovered"]);
  expect(await read(video)).toEqual(["recovered"]);
  expect(decode).toHaveBeenCalledTimes(2);
  expect(decodeFromCanvas).toHaveBeenCalledTimes(2);
  expect(decodeFromCanvas.mock.calls[0]?.[0]).toBe(decodeFromCanvas.mock.calls[1]?.[0]);
  expect(decodeFromCanvas.mock.calls[0]?.[0]).toMatchObject({ width: 256, height: 256 });
  expect(drawing.drawImage.mock.calls).toEqual([
    [video, 0, 0, 256, 256],
    [video, 0, 0, 256, 256],
  ]);
  expect(drawing.imageSmoothingEnabled).toBe(false);
});
it.each([
  [512, 319],
  [319, 512],
])("does not shrink a %s×%s frame below the minimum dimension", async (width, height) => {
  vi.stubGlobal("BarcodeDetector", undefined);
  decode.mockImplementation(() => {
    throw { name: "NotFoundException" };
  });
  const read = await createFrameReader();
  expect(await read(sizedVideo(width, height))).toEqual([]);
  expect(decodeFromCanvas).not.toHaveBeenCalled();
});
it.each(["NotFoundException", "ChecksumException", "FormatException"])(
  "keeps scanning when the bounded smaller frame reports %s",
  async (name) => {
    vi.stubGlobal("BarcodeDetector", undefined);
    decode.mockImplementation(() => {
      throw { name: "NotFoundException" };
    });
    decodeFromCanvas.mockImplementation(() => {
      throw { name };
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const read = await createFrameReader();
    expect(await read(sizedVideo(512, 512))).toEqual([]);
    expect(decodeFromCanvas).toHaveBeenCalledTimes(1);
  },
);
it("keeps full-size scanning available if a smaller canvas context cannot be created", async () => {
  vi.stubGlobal("BarcodeDetector", undefined);
  decode.mockImplementation(() => {
    throw { name: "NotFoundException" };
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const read = await createFrameReader();
  expect(await read(sizedVideo(512, 512))).toEqual([]);
  expect(decodeFromCanvas).not.toHaveBeenCalled();
});
it.each(["ChecksumException", "FormatException"])(
  "retries a bounded copy after a %s finder failure",
  async (name) => {
    vi.stubGlobal("BarcodeDetector", undefined);
    decode.mockImplementation(() => {
      throw { name };
    });
    decodeFromCanvas.mockReturnValue({ getText: () => "recovered" });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const read = await createFrameReader();
    expect(await read(sizedVideo(512, 512))).toEqual(["recovered"]);
    expect(decodeFromCanvas).toHaveBeenCalledTimes(1);
  },
);
it("propagates an unexpected smaller-frame decoder failure instead of masking it", async () => {
  vi.stubGlobal("BarcodeDetector", undefined);
  decode.mockImplementation(() => {
    throw { name: "NotFoundException" };
  });
  decodeFromCanvas.mockImplementation(() => {
    throw new Error("scaled decoder failure");
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  const read = await createFrameReader();
  await expect(read(sizedVideo(512, 512))).rejects.toThrow("scaled decoder failure");
});
it("cycles only one same-frame retry and resets after success or dimension changes", async () => {
  vi.stubGlobal("BarcodeDetector", undefined);
  decode.mockImplementation(() => {
    throw { name: "FormatException" };
  });
  decodeFromCanvas.mockImplementation(() => {
    throw { name: "NotFoundException" };
  });
  const drawing = { drawImage: vi.fn(), setTransform: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    drawing as unknown as CanvasRenderingContext2D,
  );
  const read = await createFrameReader();
  const frame = sizedVideo(640, 480);
  for (let index = 0; index < 5; index++) expect(await read(frame)).toEqual([]);
  expect(decode).toHaveBeenCalledTimes(5);
  expect(decodeFromCanvas).toHaveBeenCalledTimes(5);
  expect(drawing.setTransform.mock.calls).toEqual([
    [1, 0, 0, 1, 0, 0],
    [0, 1, -1, 0, 480, 0],
    [-1, 0, 0, -1, 640, 480],
    [0, -1, 1, 0, 0, 640],
    [1, 0, 0, 1, 0, 0],
  ]);
  expect(drawing.drawImage.mock.calls.every(([source]) => source === frame)).toBe(true);
  await read(sizedVideo(512, 512));
  expect(drawing.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, 0, 0);
  decodeFromCanvas.mockReturnValueOnce({ getText: () => "success" });
  expect(await read(sizedVideo(512, 512))).toEqual(["success"]);
  await read(sizedVideo(512, 512));
  expect(drawing.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, 0, 0);
  decode.mockReturnValueOnce({ getText: () => "full" });
  expect(await read(sizedVideo(512, 512))).toEqual(["full"]);
  await read(sizedVideo(512, 512));
  expect(drawing.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, 0, 0);
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
it("falls back when the native capability probe never settles", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "BarcodeDetector",
    class {
      static getSupportedFormats = () => new Promise<string[]>(() => {});
    },
  );
  decode.mockReturnValue({ getText: () => "fallback-code" });
  const pending = createFrameReader();
  await vi.advanceTimersByTimeAsync(200);
  const read = await pending;
  expect(await read(document.createElement("video"))).toEqual(["fallback-code"]);
});
it.each(["unsupported", "rejected", "constructor"])(
  "uses fallback after %s native capability",
  async (mode) => {
    vi.stubGlobal(
      "BarcodeDetector",
      class {
        static async getSupportedFormats() {
          if (mode === "rejected") throw new Error("unsupported platform");
          return mode === "unsupported" ? ["ean_13"] : ["qr_code"];
        }
        constructor() {
          throw new Error("unsupported detector");
        }
      },
    );
    decode.mockReturnValue({ getText: () => "fallback-code" });
    const read = await createFrameReader();
    expect(await read(document.createElement("video"))).toEqual(["fallback-code"]);
  },
);
it("recognizes name-only blank-frame errors across module realms", async () => {
  vi.stubGlobal("BarcodeDetector", undefined);
  decode.mockImplementation(() => {
    throw { name: "NotFoundException" };
  });
  const read = await createFrameReader();
  expect(await read(document.createElement("video"))).toEqual([]);
  expect(await read(document.createElement("video"))).toEqual([]);
});
