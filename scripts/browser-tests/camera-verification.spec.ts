import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import QRCode from "qrcode";
import type { startQrCamera } from "../../src/modules/checkin/lib/camera-reader";

declare global {
  interface Window {
    CameraReader: { startQrCamera: typeof startQrCamera };
    cameraResult: {
      codes: string[];
      readTimes: number[];
      debug?: string[];
      problems: string[];
      stop?: () => void;
      tracks?: MediaStreamTrack[];
    };
  }
}
for (const fallback of [false, true]) {
  test(`actual video pixels decode with default/fallback=${fallback}`, async ({ page }) => {
    const bundle = await build({
      entryPoints: ["src/modules/checkin/lib/camera-reader.ts"],
      bundle: true,
      platform: "browser",
      format: "iife",
      globalName: "CameraReader",
      write: false,
      target: "es2020",
    });
    const script = bundle.outputFiles[0];
    if (!script) throw new Error("Camera bundle missing");
    const data = await QRCode.toDataURL("synthetic-camera-qr", { width: 512, margin: 4 });
    await page.route("http://localhost:32918/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><title>Camera fixture</title><button>Open camera</button><video muted playsinline width="512" height="512"></video>',
      }),
    );
    await page.goto("http://localhost:32918/");
    if (fallback)
      await page.evaluate(() =>
        Object.defineProperty(window, "BarcodeDetector", { value: undefined, configurable: true }),
      );
    await page.addScriptTag({ content: script.text });
    await page.evaluate(async (src) => {
      const video = document.querySelector("video");
      if (!video) throw new Error("Fixture video missing");
      video.muted = true;
      video.playsInline = true;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas context missing");
      // Start blank: the decoder must tolerate frames without a code.
      context.fillStyle = "white";
      context.fillRect(0, 0, 512, 512);
      const stream = canvas.captureStream(15);
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            window.cameraResult.debug?.push("fake media granted");
            return stream;
          },
        },
      });
      const image = new Image();
      image.src = src;
      await image.decode();
      const redraw = setInterval(() => {
        context.drawImage(image, 0, 0);
      }, 100);
      const controller = new AbortController();
      window.cameraResult = {
        codes: [],
        readTimes: [],
        problems: [],
        debug: [],
        tracks: stream.getTracks(),
        stop: () => {
          controller.abort();
          clearInterval(redraw);
        },
      };
      const play = video.play.bind(video);
      video.play = async () => {
        try {
          await play();
        } catch (error) {
          window.cameraResult.debug?.push(error instanceof Error ? error.message : String(error));
          throw error;
        }
      };
      const button = document.querySelector("button");
      if (!button) throw new Error("Camera start button missing");
      button.onclick = () => {
        void window.CameraReader.startQrCamera({
          video,
          signal: controller.signal,
          onCode: (code) => {
            window.cameraResult.codes.push(code);
            window.cameraResult.readTimes.push(performance.now());
            if (window.cameraResult.codes.length === 2) window.cameraResult.stop?.();
          },
          onProblem: (problem) => window.cameraResult.problems.push(problem),
          onTorchAvailable: () => {},
        });
      };
    }, data);
    await page.getByRole("button", { name: "Open camera" }).click();
    await expect
      .poll(() =>
        page.evaluate(() => ({
          codes: window.cameraResult.codes.length,
          problems: window.cameraResult.problems,
          debug: window.cameraResult.debug,
          ready: document.querySelector("video")?.readyState,
          width: document.querySelector("video")?.videoWidth,
        })),
      )
      .toEqual({ codes: 1, problems: [], debug: ["fake media granted"], ready: 4, width: 512 });
    expect(await page.evaluate(() => window.cameraResult.codes[0])).toBe("synthetic-camera-qr");
    expect(await page.evaluate(() => window.cameraResult.problems)).toEqual([]);
    // Keep the same real QR pixels in view: decoding continues, but delivery
    // must remain throttled across actual animation/video frames.
    await expect.poll(() => page.evaluate(() => window.cameraResult.codes.length)).toBe(2);
    const reads = await page.evaluate(() => window.cameraResult.readTimes);
    expect(reads).toHaveLength(2);
    const [first, second] = reads;
    if (first === undefined || second === undefined) throw new Error("Two reads required");
    expect(second - first).toBeGreaterThanOrEqual(3_000);
    expect(await page.evaluate(() => window.cameraResult.codes)).toEqual([
      "synthetic-camera-qr",
      "synthetic-camera-qr",
    ]);
    await page.evaluate(() => window.cameraResult.stop?.());
    expect(
      await page.evaluate(() =>
        window.cameraResult.tracks?.every((track) => track.readyState === "ended"),
      ),
    ).toBe(true);
  });
}
