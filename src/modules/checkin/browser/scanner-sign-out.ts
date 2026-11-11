import { createScannerShellStore } from "./scanner-shell-store";
import { scannerWorkerMessage } from "./scanner-worker-message";
import { createGuestSnapshotStore } from "./guest-snapshot-store";
import { parseGuestSnapshot } from "../lib/guest-snapshot";

/** Also works before a worker controls this page; the publication lock is shared with workers. */
export async function clearScannerForSignOut(): Promise<boolean> {
  const result = await scannerWorkerMessage("INVALIDATE_SCANNER");
  if (
    typeof result === "object" &&
    result !== null &&
    "state" in result &&
    result.state === "removed" &&
    "privateSnapshotRemoved" in result &&
    result.privateSnapshotRemoved === true
  )
    return true;
  try {
    if (!navigator.locks) return false;
    await navigator.locks.request("wedding-scanner-shell-publication-v1", async () => {
      const results = await Promise.allSettled([
        Promise.resolve().then(() => createScannerShellStore().invalidate()),
        Promise.resolve().then(() => createGuestSnapshotStore(parseGuestSnapshot).invalidate()),
      ]);
      if (results.some((result) => result.status === "rejected"))
        throw new Error("Scanner invalidation incomplete");
    });
    return true;
  } catch {
    return false;
  } finally {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("wedding-scanner-session-v1");
        channel.postMessage({ type: "SCANNER_INVALIDATED" });
        channel.close();
      }
    } catch {
      /* Storage result remains authoritative when cross-tab signalling is unavailable. */
    }
  }
}
