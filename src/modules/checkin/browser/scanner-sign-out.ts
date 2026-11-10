import { createScannerShellStore } from "./scanner-shell-store";
import { scannerWorkerMessage } from "./scanner-worker-message";

/** Also works before a worker controls this page; the publication lock is shared with workers. */
export async function clearScannerForSignOut(): Promise<boolean> {
  const result = await scannerWorkerMessage("INVALIDATE_SCANNER");
  if (
    typeof result === "object" &&
    result !== null &&
    "state" in result &&
    result.state === "removed"
  )
    return true;
  try {
    if (!navigator.locks) return false;
    await navigator.locks.request("wedding-scanner-shell-publication-v1", async () => {
      await createScannerShellStore().invalidate();
    });
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("wedding-scanner-session-v1");
      channel.postMessage({ type: "SCANNER_INVALIDATED" });
      channel.close();
    }
    return true;
  } catch {
    return false;
  }
}
