import { createScanThrottle } from "./scan-throttle";

type NativeDetector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type NativeDetectorConstructor = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats(): Promise<string[]>;
};
export type CameraProblem = "denied" | "missing" | "busy" | "unsupported" | "failed";
export type CameraControls = { stop(): void; setTorch(enabled: boolean): Promise<boolean> };
export type FrameReader = (video: HTMLVideoElement) => Promise<string[]>;

function exceptionName(error: unknown): string {
  return typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
    ? error.name
    : "";
}

function decodeException(error: unknown): string {
  return typeof error === "object" &&
    error !== null &&
    "getKind" in error &&
    typeof error.getKind === "function"
    ? error.getKind()
    : exceptionName(error);
}

export function cameraProblem(error: unknown): CameraProblem {
  const name = exceptionName(error);
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "missing";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "failed";
}

async function withinNativeBudget<T>(operation: Promise<T>): Promise<T | null> {
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<null>((resolve) => {
        deadline = setTimeout(() => resolve(null), 200);
      }),
    ]);
  } finally {
    clearTimeout(deadline);
  }
}

/** Native detection is optional; the fallback reads real video pixels, never QR URLs. */
export async function createFrameReader(): Promise<FrameReader> {
  let native: NativeDetector | null = null;
  const Detector = (
    globalThis as typeof globalThis & {
      BarcodeDetector?: NativeDetectorConstructor;
    }
  ).BarcodeDetector;
  try {
    if (Detector && (await withinNativeBudget(Detector.getSupportedFormats()))?.includes("qr_code"))
      native = new Detector({ formats: ["qr_code"] });
  } catch {
    // Unsupported or broken native implementations use the same fallback as Safari.
  }
  let fallback: FrameReader | undefined;
  return async (video) => {
    if (native) {
      try {
        const result = await withinNativeBudget(native.detect(video));
        if (result === null) native = null;
        else if (result.length) return result.map((item) => item.rawValue);
      } catch {
        native = null;
      }
    }
    if (!fallback) {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      let smaller: HTMLCanvasElement | undefined;
      fallback = async (source) => {
        try {
          return [reader.decode(source).getText()];
        } catch (error) {
          const name = decodeException(error);
          // Finder-pattern detection can miss a valid dense QR at one pixel
          // scale. Retry this same frame once at half size, keeping >=160px in
          // each dimension. Native/full-size success never pays this cost.
          if (
            name === "NotFoundException" &&
            source.videoWidth >= 320 &&
            source.videoHeight >= 320
          ) {
            smaller ??= document.createElement("canvas");
            const width = Math.floor(source.videoWidth / 2);
            const height = Math.floor(source.videoHeight / 2);
            if (smaller.width !== width) smaller.width = width;
            if (smaller.height !== height) smaller.height = height;
            const context = smaller.getContext("2d");
            if (context) {
              context.imageSmoothingEnabled = false;
              context.drawImage(source, 0, 0, width, height);
              try {
                return [reader.decodeFromCanvas(smaller).getText()];
              } catch (scaledError) {
                if (
                  !["NotFoundException", "ChecksumException", "FormatException"].includes(
                    decodeException(scaledError),
                  )
                )
                  throw scaledError;
              }
            }
            return [];
          }
          if (["NotFoundException", "ChecksumException", "FormatException"].includes(name))
            return [];
          throw error;
        }
      };
    }
    return fallback(video);
  };
}

/** Owns one stream and one serial decoding loop; abort also cleans up late permission grants. */
export async function startQrCamera(options: {
  video: HTMLVideoElement;
  signal: AbortSignal;
  onCode(code: string): void;
  onProblem(problem: CameraProblem): void;
  onTorchAvailable(available: boolean): void;
  readFrame?: FrameReader;
}): Promise<CameraControls> {
  const { video, signal } = options;
  let stream: MediaStream | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = signal.aborted;
  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    signal.removeEventListener("abort", stop);
    for (const track of stream?.getTracks() ?? []) track.stop();
    if (video.srcObject === stream) video.srcObject = null;
  };
  const controls: CameraControls = {
    stop,
    async setTorch(enabled) {
      const track = stream?.getVideoTracks()[0];
      if (stopped || !track) return false;
      try {
        await track.applyConstraints({ advanced: [{ torch: enabled } as MediaTrackConstraintSet] });
        return !stopped;
      } catch {
        return false;
      }
    },
  };
  if (stopped) return controls;
  signal.addEventListener("abort", stop, { once: true });
  if (!navigator.mediaDevices?.getUserMedia) {
    stop();
    options.onProblem("unsupported");
    return controls;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
    });
    if (stopped) {
      stop();
      return controls;
    }
    video.srcObject = stream;
    await video.play();
    if (stopped) {
      stop();
      return controls;
    }
    const track = stream.getVideoTracks()[0];
    const capabilities = track?.getCapabilities?.() as
      (MediaTrackCapabilities & { torch?: boolean }) | undefined;
    options.onTorchAvailable(capabilities?.torch === true);
    track?.addEventListener(
      "ended",
      () => {
        if (!stopped) {
          stop();
          options.onProblem("missing");
        }
      },
      { once: true },
    );
    const read = options.readFrame ?? (await createFrameReader());
    const accept = createScanThrottle();
    const scan = async () => {
      if (stopped) return;
      try {
        if (video.readyState >= 2) {
          const codes = await read(video);
          if (stopped) return;
          for (const code of codes) {
            if (stopped) return;
            if (accept(code, performance.now())) options.onCode(code);
          }
        }
      } catch {
        if (!stopped) {
          stop();
          options.onProblem("failed");
        }
        return;
      }
      if (!stopped)
        timer = setTimeout(() => {
          void scan();
        }, 150);
    };
    void scan();
  } catch (error) {
    const report = !stopped;
    stop();
    if (report) options.onProblem(cameraProblem(error));
  }
  return controls;
}
