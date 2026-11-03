"use client";
import { useEffect, useState } from "react";

export function OfflinePassSave() {
  const [message, setMessage] = useState("Keep a screenshot of your pass as a backup.");
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    let stopped = false;
    let channel: MessageChannel | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    async function save() {
      channel?.port1.close();
      clearTimeout(timeout);
      try {
        const registration = await navigator.serviceWorker.ready;
        if (stopped || !registration.active) return;
        channel = new MessageChannel();
        timeout = setTimeout(() => {
          channel?.port1.close();
          if (!stopped)
            setMessage("We couldn't save an offline copy. Keep a screenshot as a backup.");
        }, 15000);
        channel.port1.onmessage = (event: MessageEvent<unknown>) => {
          clearTimeout(timeout);
          channel?.port1.close();
          if (stopped) return;
          const data = event.data;
          if (
            typeof data === "object" &&
            data !== null &&
            "state" in data &&
            data.state === "saved"
          ) {
            setMessage("Saved for offline. Reopen this invitation link to find your pass.");
          } else if (
            typeof data === "object" &&
            data !== null &&
            "state" in data &&
            data.state === "removed"
          ) {
            setMessage("This pass is no longer available. Refreshing your invitation…");
            window.location.reload();
          } else {
            setMessage("We couldn't refresh your offline copy. Keep a screenshot as a backup.");
          }
        };
        const styles = Array.from(
          document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
        )
          .map((link) => new URL(link.href))
          .filter((url) => url.origin === location.origin && !url.search)
          .map((url) => url.pathname);
        registration.active.postMessage(
          {
            type: "SAVE_OWN_PASS",
            path: location.pathname,
            appearance: { classes: document.documentElement.className, styles },
          },
          [channel.port2],
        );
      } catch {
        if (!stopped)
          setMessage("We couldn't save an offline copy. Keep a screenshot as a backup.");
      }
    }
    void save();
    window.addEventListener("online", save);
    return () => {
      stopped = true;
      clearTimeout(timeout);
      channel?.port1.close();
      window.removeEventListener("online", save);
    };
  }, []);
  return (
    <p role="status" className="mt-6 min-h-20 text-base leading-relaxed">
      {message}
    </p>
  );
}
