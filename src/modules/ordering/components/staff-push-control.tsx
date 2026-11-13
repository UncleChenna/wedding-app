"use client";

import { useEffect, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import type { Station } from "../lib/stations";
import { readStaffPushConfig, removeStaffPush, saveStaffPush } from "../server/staff-push-actions";

function keyBytes(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (char) =>
    char.charCodeAt(0),
  );
}

function matchesApplicationKey(subscription: PushSubscription, publicKey: string) {
  const actual = subscription.options.applicationServerKey;
  const expected = keyBytes(publicKey);
  return (
    actual !== null &&
    actual.byteLength === expected.byteLength &&
    new Uint8Array(actual).every((byte, index) => byte === expected[index])
  );
}

export function StaffPushControl({ station }: { station: Station }) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    )
      return;
    let active = true;
    void navigator.serviceWorker
      .getRegistration()
      .then(async (registration) => {
        const [subscription, config] = await Promise.all([
          registration?.pushManager.getSubscription(),
          readStaffPushConfig(station),
        ]);
        if (active) {
          setAvailable(Boolean(config));
          setPublicKey(config?.publicKey ?? null);
          setEnabled(
            Boolean(
              subscription &&
              config &&
              config.enabledEndpoint === subscription.endpoint &&
              matchesApplicationKey(subscription, config.publicKey),
            ),
          );
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [station]);

  async function toggle() {
    setBusy(true);
    setMessage("");
    try {
      if (!enabled && (!publicKey || (await Notification.requestPermission()) !== "granted")) {
        setMessage("Notifications are off. Keep the board open for new orders.");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active) {
        setMessage("Notifications are not ready yet. Keep this board open and try again.");
        return;
      }
      let current = await registration.pushManager.getSubscription();
      if (enabled) {
        if (!(await removeStaffPush(station))) throw new Error("preference unavailable");
        await current?.unsubscribe();
        setEnabled(false);
        setMessage("Notifications are off. Orders still appear on this board.");
        return;
      }
      if (!publicKey) throw new Error("notifications unavailable");
      if (current && !matchesApplicationKey(current, publicKey)) {
        if (!(await current.unsubscribe())) throw new Error("old subscription unavailable");
        current = null;
      }
      const subscription =
        current ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(publicKey),
        }));
      const json = subscription.toJSON();
      if (!(await saveStaffPush(station, { endpoint: json.endpoint, keys: json.keys }))) {
        if (!current) await subscription.unsubscribe();
        throw new Error("preference unavailable");
      }
      setEnabled(true);
      setMessage("Notifications are on for this device.");
    } catch {
      setMessage("Notifications are unavailable right now. Your board still works.");
    } finally {
      setBusy(false);
    }
  }

  if (!available) return null;
  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" disabled={busy} onClick={() => void toggle()}>
        {busy
          ? "Updating notifications…"
          : enabled
            ? "Turn notifications off"
            : "Notify me of new orders"}
      </Button>
      {message ? (
        <p role="status" className="text-base leading-relaxed text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
