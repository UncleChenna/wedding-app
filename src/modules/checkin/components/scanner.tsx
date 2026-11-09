"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { startQrCamera, type CameraControls, type CameraProblem } from "../lib/camera-reader";

const recovery: Record<CameraProblem, string> = {
  denied: "Allow camera access in your browser’s site settings, then try again.",
  missing: "No camera is available. Connect a camera or use another scanner.",
  busy: "Your camera may be in use elsewhere. Close the other app, then try again.",
  unsupported: "This browser cannot open a camera here. Open the secure site in Safari or Chrome.",
  failed: "The camera stopped. Try again, or ask the gate lead for help.",
};

/** Camera capture only. A decoded QR is never an admission decision. */
export function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
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
  const [reads, setReads] = useState(0);

  function stop() {
    active.current?.abort();
    active.current = null;
    controls.current?.stop();
    controls.current = null;
    setTorchOn(false);
    setTorchBusy(false);
    setTorchAvailable(false);
    setState("paused");
  }

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      active.current?.abort();
      controls.current?.stop();
    };
  }, []);

  async function start() {
    if (!video.current || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setState("starting");
    setReads(0);
    setTorchFailed(false);
    const next = await startQrCamera({
      video: video.current,
      signal: controller.signal,
      onCode() {
        if (!controller.signal.aborted) setReads((previous) => previous + 1);
      },
      onProblem(value) {
        if (controller.signal.aborted) return;
        controller.abort();
        active.current = null;
        controls.current = null;
        setTorchBusy(false);
        setTorchAvailable(false);
        setTorchOn(false);
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
      <div className="relative aspect-square max-h-[min(42svh,22rem)] w-full overflow-hidden rounded-lg border border-border bg-surface-muted">
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
        className="min-h-24 text-lg leading-relaxed"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state === "idle" && <p>Open the camera and hold the guest’s QR inside the viewfinder.</p>}
        {state === "starting" && <p>Opening the camera…</p>}
        {state === "paused" && <p>Camera paused. Open it again when you’re ready.</p>}
        {state === "problem" && <p>{recovery[problem]}</p>}
        {state === "scanning" &&
          (reads ? (
            <>
              <p className="text-3xl font-semibold">QR read</p>
              <p>
                Check-in confirmation is not available yet. Ask the gate lead before admitting
                anyone.
              </p>
            </>
          ) : (
            <p>Camera ready. Hold the QR steady.</p>
          ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {state === "scanning" || state === "starting" ? (
          <Button size="lg" variant="secondary" onClick={stop}>
            Pause camera
          </Button>
        ) : (
          <Button size="lg" onClick={() => void start()}>
            {state === "problem" ? "Retry camera" : "Open camera"}
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
