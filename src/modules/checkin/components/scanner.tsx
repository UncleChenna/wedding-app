"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { startQrCamera, type CameraControls, type CameraProblem } from "../lib/camera-reader";
import { AdmissionResult, type AdmissionSubmitter } from "./admission-result";
import type { AdmissionResponse } from "../lib/online-admission";
import { scanReadResultSchema, type ScanReadResult } from "../lib/scan-read-result";
import { requestScanFeedback } from "../lib/scan-feedback";

export type ScanResolver = (qr: string, signal: AbortSignal) => Promise<ScanReadResult>;
export async function readLivePass(qr: string, signal: AbortSignal): Promise<ScanReadResult> {
  const response = await fetch("/api/checkin/read", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      qr: qr.length > 4096 ? "invalid:oversized-qr" : qr,
      reportedAt: new Date().toISOString(),
    }),
  });
  if (response.status === 403) return { state: "session_expired" };
  const parsed = scanReadResultSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : { state: "unavailable" };
}

const recovery: Record<CameraProblem, string> = {
  denied: "Allow camera access in your browser’s site settings, then try again.",
  missing: "No camera is available. Connect a camera or use another scanner.",
  busy: "Your camera may be in use elsewhere. Close the other app, then try again.",
  unsupported: "This browser cannot open a camera here. Open the secure site in Safari or Chrome.",
  failed: "The camera stopped. Try again, or ask the gate lead for help.",
};

/** Capture checks the pass; only an explicit confirmed count records admission. */
export function Scanner({
  resolveRead = readLivePass,
  submitAdmission,
  allowAdmission = true,
  onAdmissionRecorded,
  onAdmissionOutcome,
  readOnlyNotice,
}: {
  resolveRead?: ScanResolver;
  submitAdmission?: AdmissionSubmitter;
  allowAdmission?: boolean;
  onAdmissionRecorded?: () => void;
  onAdmissionOutcome?: (response: AdmissionResponse) => void;
  readOnlyNotice?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const resultRegion = useRef<HTMLDivElement>(null);
  const active = useRef<AbortController | null>(null);
  const controls = useRef<CameraControls | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "scanning" | "paused" | "problem">(
    "idle",
  );
  const [problem, setProblem] = useState<CameraProblem>("failed");
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchBusy, setTorchBusy] = useState(false);
  const [torchFailed, setTorchFailed] = useState(false);
  const [readResult, setReadResult] = useState<ScanReadResult | null>(null);
  const [reading, setReading] = useState(false);
  const [admissionBusy, setAdmissionBusy] = useState(false);
  const [admissionCompleted, setAdmissionCompleted] = useState(false);
  const [checkedQr, setCheckedQr] = useState<string | null>(null);
  const readController = useRef<AbortController | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const clearRead = useCallback(() => {
    readController.current?.abort();
    readController.current = null;
    setReadResult(null);
    setReading(false);
    setCheckedQr(null);
    setAdmissionBusy(false);
    setAdmissionCompleted(false);
    const previousAudio = audio.current;
    audio.current = null;
    if (previousAudio) void previousAudio.close().catch(() => {});
  }, []);

  async function check(qr: string, cameraSignal: AbortSignal) {
    readController.current?.abort();
    const request = new AbortController();
    readController.current = request;
    setReading(true);
    setReadResult(null);
    let result: ScanReadResult;
    try {
      result = await resolveRead(qr, request.signal);
    } catch {
      result = { state: "unavailable" };
    }
    if (cameraSignal.aborted || request.signal.aborted) return;
    const parsed = scanReadResultSchema.safeParse(result);
    result = parsed.success ? parsed.data : { state: "unavailable" };
    active.current?.abort();
    active.current = null;
    controls.current?.stop();
    controls.current = null;
    setTorchOn(false);
    setTorchBusy(false);
    setTorchAvailable(false);
    setState("paused");
    setReadResult(result);
    setCheckedQr(result.state === "valid" ? qr : null);
    setReading(false);
    if (result.state === "valid")
      requestScanFeedback({
        play: () => {
          const context = audio.current;
          if (!context || context.state !== "running") return;
          const oscillator = context.createOscillator();
          const volume = context.createGain();
          volume.gain.value = 0.08;
          oscillator.frequency.value = 660;
          oscillator.connect(volume);
          volume.connect(context.destination);
          oscillator.onended = () => {
            oscillator.disconnect();
            volume.disconnect();
          };
          oscillator.start();
          oscillator.stop(context.currentTime + 0.08);
        },
        vibrate:
          typeof navigator.vibrate === "function"
            ? (duration) => navigator.vibrate(duration)
            : undefined,
      });
  }

  useEffect(() => {
    if (readResult) resultRegion.current?.focus();
  }, [readResult]);

  const pauseCapture = useCallback(() => {
    readController.current?.abort();
    readController.current = null;
    setReading(false);
    active.current?.abort();
    active.current = null;
    controls.current?.stop();
    controls.current = null;
    setTorchOn(false);
    setTorchBusy(false);
    setTorchAvailable(false);
    setState("paused");
    const previousAudio = audio.current;
    audio.current = null;
    if (previousAudio) void previousAudio.close().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    clearRead();
    pauseCapture();
  }, [clearRead, pauseCapture]);

  useEffect(() => {
    const onVisibility = () => {
      // Hiding a phone stops its camera, not its unresolved transaction. Keep
      // AdmissionResult mounted so a lost receipt retries the original event ID.
      if (document.hidden) pauseCapture();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      active.current?.abort();
      readController.current?.abort();
      const previousAudio = audio.current;
      audio.current = null;
      if (previousAudio) void previousAudio.close().catch(() => {});
      controls.current?.stop();
    };
  }, [pauseCapture]);

  async function start() {
    if (!video.current || active.current || admissionBusy) return;
    const controller = new AbortController();
    active.current = controller;
    setState("starting");
    clearRead();
    try {
      if (typeof AudioContext !== "undefined") {
        const context = new AudioContext();
        audio.current = context;
        void context.resume().catch(() => {});
      }
    } catch {
      /* Optional audio must not prevent opening the camera. */
    }
    setTorchFailed(false);
    const next = await startQrCamera({
      video: video.current,
      signal: controller.signal,
      onCode(qr) {
        if (!controller.signal.aborted) void check(qr, controller.signal);
      },
      onProblem(value) {
        if (controller.signal.aborted) return;
        controller.abort();
        active.current = null;
        controls.current = null;
        setTorchBusy(false);
        setTorchAvailable(false);
        setTorchOn(false);
        clearRead();
        setProblem(value);
        setState("problem");
      },
      onTorchAvailable(available) {
        if (controller.signal.aborted) return;
        setTorchAvailable(available);
        setState("scanning");
      },
    });
    if (controller.signal.aborted) next.stop();
    else controls.current = next;
  }

  async function toggleTorch() {
    const current = controls.current;
    const controller = active.current;
    if (!current || !controller || torchBusy) return;
    setTorchBusy(true);
    const target = !torchOn;
    const changed = await current.setTorch(target);
    if (controller.signal.aborted || controller !== active.current) return;
    setTorchBusy(false);
    setTorchFailed(!changed);
    if (changed) setTorchOn(target);
  }

  return (
    <section className="flex w-full flex-col gap-6 text-left" aria-label="QR camera">
      {!readResult && state !== "scanning" && state !== "starting" && (
        <div>
          <Button size="lg" onClick={() => void start()}>
            {state === "problem" ? "Retry camera" : "Open camera"}
          </Button>
        </div>
      )}
      <div
        className={
          readResult
            ? "hidden"
            : "relative aspect-square max-h-[min(42svh,22rem)] w-full overflow-hidden rounded-lg border border-border bg-surface-muted"
        }
      >
        <video
          ref={video}
          muted
          playsInline
          aria-label="Camera viewfinder"
          className="h-full w-full object-cover"
        />
        {state !== "scanning" && state !== "starting" && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-lg text-muted-foreground">
            Camera is off
          </p>
        )}
      </div>
      <div
        className={readResult ? "sr-only" : "min-h-24 text-lg leading-relaxed"}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state === "idle" && <p>Open the camera and hold the guest’s QR inside the viewfinder.</p>}
        {state === "starting" && <p>Opening the camera…</p>}
        {state === "paused" && !readResult && (
          <p>Camera paused. Open it again when you’re ready.</p>
        )}
        {state === "problem" && <p>{recovery[problem]}</p>}
        {state === "scanning" && (
          <p>{reading ? "Checking pass…" : "Camera ready. Hold the QR steady."}</p>
        )}
      </div>
      {readResult && (
        <div
          ref={resultRegion}
          tabIndex={-1}
          className="focus-visible:outline-2 focus-visible:outline-ring"
        >
          <AdmissionResult
            result={readResult}
            qr={checkedQr}
            submit={submitAdmission}
            allowAdmission={allowAdmission}
            readOnlyNotice={readOnlyNotice}
            onBusyChange={setAdmissionBusy}
            onOutcome={onAdmissionOutcome}
            onComplete={() => {
              setAdmissionCompleted(true);
              onAdmissionRecorded?.();
            }}
          />
        </div>
      )}
      {!admissionCompleted && (
        <p className="text-lg leading-relaxed">
          A short sound means the pass was checked, not that admission was recorded.
        </p>
      )}
      {(readResult || state === "scanning" || state === "starting") && (
        <div className="flex flex-wrap gap-3">
          {state === "scanning" || state === "starting" ? (
            <Button size="lg" variant="secondary" onClick={stop}>
              Pause camera
            </Button>
          ) : (
            <Button
              size="lg"
              variant={
                readResult?.state === "valid" && !admissionCompleted ? "secondary" : "primary"
              }
              disabled={admissionBusy}
              onClick={() => void start()}
            >
              Scan next pass
            </Button>
          )}
          {torchAvailable && (
            <Button
              size="lg"
              variant="secondary"
              disabled={torchBusy}
              aria-pressed={torchOn}
              onClick={() => void toggleTorch()}
            >
              {torchOn ? "Light off" : "Light on"}
            </Button>
          )}
        </div>
      )}
      {torchFailed && (
        <p role="status" className="text-lg leading-relaxed">
          The camera light is unavailable. Scanning can continue.
        </p>
      )}
      <a
        href="#manual-check-in-help"
        className="inline-flex min-h-11 items-center text-lg text-primary underline underline-offset-4"
        onClick={() => document.getElementById("manual-check-in-help")?.focus()}
      >
        Manual check-in help
      </a>
      <section
        id="manual-check-in-help"
        tabIndex={-1}
        aria-labelledby="manual-help-title"
        className="flex flex-col gap-3 text-lg leading-relaxed focus-visible:outline-2 focus-visible:outline-ring"
      >
        <h2 id="manual-help-title" className="font-display text-3xl">
          Need a hand?
        </h2>
        <p>
          Name search is not available yet. Ask the gate lead to use the printed guest list or
          another scanner.
        </p>
      </section>
    </section>
  );
}
