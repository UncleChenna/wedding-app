"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createInstallPromptController, type InstallPromptState } from "../lib/install-prompt";
import { Button } from "./ui/button";

let controller: ReturnType<typeof createInstallPromptController> | undefined;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((listener) => listener());
const snapshot = (): InstallPromptState => controller?.getSnapshot() ?? "hidden";
const serverSnapshot = (): InstallPromptState => "hidden";
function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

/** Root-mounted capture retains eligibility across client-side navigation. */
export function InstallPromptRegistration() {
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    controller = createInstallPromptController(window, {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
    });
    const unsubscribe = controller.subscribe(notify);
    notify();
    return () => {
      unsubscribe();
      controller?.dispose();
      controller = undefined;
      notify();
    };
  }, []);
  return null;
}

export function InstallPrompt() {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return (
    // Reserve the small control row so late browser eligibility cannot shift the pass.
    <div className="mx-auto flex min-h-28 w-full max-w-xl flex-wrap items-center justify-center gap-3 px-6 py-6">
      {state !== "hidden" && (
        <>
          <Button
            variant="secondary"
            className="text-lg"
            disabled={state === "installing"}
            onClick={() => {
              void controller?.install();
            }}
          >
            {state === "installing" ? "Opening…" : "Install app"}
          </Button>
          <Button
            variant="ghost"
            className="text-lg"
            disabled={state === "installing"}
            onClick={() => controller?.dismiss()}
          >
            Not now
          </Button>
        </>
      )}
    </div>
  );
}
