"use client";

import { useState, useSyncExternalStore } from "react";
import { iosInstallMode, type IosInstallMode } from "../lib/ios-install-guide";
import { Button } from "./ui/button";
import { Sheet } from "./ui/sheet";

const serverSnapshot = (): IosInstallMode => null;
function snapshot(): IosInstallMode {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return iosInstallMode({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: iosNavigator.standalone === true,
    displayModeStandalone: window.matchMedia?.("(display-mode: standalone)")?.matches ?? false,
  });
}
function subscribe(notify: () => void) {
  const media = window.matchMedia?.("(display-mode: standalone)");
  media?.addEventListener?.("change", notify);
  document.addEventListener("visibilitychange", notify);
  return () => {
    media?.removeEventListener?.("change", notify);
    document.removeEventListener("visibilitychange", notify);
  };
}

function GuideIcon({ kind }: { kind: "share" | "home" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-8 shrink-0 text-primary"
    >
      {kind === "share" ? (
        <>
          <path d="M10 13H6v15h20V13h-4M16 21V3m-5 5 5-5 5 5" />
        </>
      ) : (
        <>
          <rect x="5" y="5" width="22" height="22" rx="2" />
          <path d="M16 10v12m-6-6h12" />
        </>
      )}
    </svg>
  );
}

/** Optional help; never automatically opens a modal or copies a private invitation link. */
export function IosInstallGuide() {
  const mode = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto flex min-h-28 w-full max-w-xl items-center justify-center px-6 py-6">
      {mode !== null && (
        <>
          <Button variant="secondary" className="text-lg" onClick={() => setOpen(true)}>
            Add to Home Screen
          </Button>
          <Sheet
            open={open}
            onOpenChange={setOpen}
            title="Keep us close"
            className="max-h-[90dvh] overflow-y-auto [&_h2]:text-3xl"
          >
            <div className="space-y-6 text-lg leading-relaxed">
              {mode === "open-safari" ? (
                <p>
                  Open this page in Safari first. If you came from WhatsApp, use its browser menu to
                  open in Safari, or copy the link and paste it into Safari.
                </p>
              ) : (
                <p>
                  Opened this link in WhatsApp? Open it in Safari first, then follow these steps.
                </p>
              )}
              <ol className="space-y-6">
                <li className="flex items-start gap-4">
                  <GuideIcon kind="share" />
                  <div>
                    <p className="font-medium">1. Open Share in Safari</p>
                    <p>You may find Share in the page menu.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <GuideIcon kind="home" />
                  <div>
                    <p className="font-medium">2. Choose Add to Home Screen</p>
                    <p>Scroll through the actions. If it is missing, look in Edit Actions.</p>
                  </div>
                </li>
                <li>
                  <p className="font-medium">3. Add your shortcut</p>
                  <p>Turn on Open as Web App if shown, then tap Add.</p>
                </li>
              </ol>
              <p>Keep your invitation link for your personal pass.</p>
              <Button fullWidth className="text-lg" onClick={() => setOpen(false)}>
                Got it
              </Button>
            </div>
          </Sheet>
        </>
      )}
    </div>
  );
}
