export const INSTALL_DISMISSED_KEY = "wedding-install-dismissed-until";
export const DISMISSAL_MS = 30 * 24 * 60 * 60 * 1000;
export type InstallPromptState = "hidden" | "available" | "installing";
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
type StorageAccess = Pick<Storage, "getItem" | "setItem">;

/** One browser event can be consumed only once, even across several mounted controls. */
export function createInstallPromptController(
  host: EventTarget,
  storage: StorageAccess,
  now: () => number = Date.now,
) {
  let deferred: InstallEvent | undefined;
  let interacted = false;
  let installed = false;
  let disposed = false;
  let busy = false;
  let until = 0;
  let state: InstallPromptState = "hidden";
  const listeners = new Set<() => void>();
  try {
    const value = Number(storage.getItem(INSTALL_DISMISSED_KEY));
    if (Number.isFinite(value)) until = value;
  } catch {
    // Private browsing may disable storage; session dismissal still works.
  }
  const update = () => {
    const next =
      disposed || installed || until > now()
        ? "hidden"
        : busy
          ? "installing"
          : deferred && interacted
            ? "available"
            : "hidden";
    if (next !== state) {
      state = next;
      listeners.forEach((listener) => listener());
    }
  };
  const dismiss = () => {
    until = now() + DISMISSAL_MS;
    try {
      storage.setItem(INSTALL_DISMISSED_KEY, String(until));
    } catch {
      // Keep the in-memory dismissal when persistent storage is unavailable.
    }
    update();
  };
  const capture = (event: Event) => {
    if (!("prompt" in event) || typeof event.prompt !== "function" || !("userChoice" in event))
      return;
    event.preventDefault();
    if (!installed && !busy) deferred = event as InstallEvent;
    update();
  };
  const interact = () => {
    interacted = true;
    update();
  };
  const markInstalled = () => {
    installed = true;
    deferred = undefined;
    update();
  };
  host.addEventListener("beforeinstallprompt", capture);
  host.addEventListener("pointerup", interact);
  host.addEventListener("keyup", interact);
  host.addEventListener("appinstalled", markInstalled);
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dismiss,
    async install() {
      if (state !== "available" || !deferred || busy) return;
      const event = deferred;
      deferred = undefined;
      busy = true;
      update();
      try {
        // Called synchronously from the click handler to retain user activation.
        await event.prompt();
        const result = await event.userChoice;
        if (result.outcome === "dismissed") dismiss();
        else installed = true;
      } catch {
        // A rejected or expired native prompt must not interrupt the page.
        dismiss();
      } finally {
        busy = false;
        update();
      }
    },
    dispose() {
      disposed = true;
      deferred = undefined;
      host.removeEventListener("beforeinstallprompt", capture);
      host.removeEventListener("pointerup", interact);
      host.removeEventListener("keyup", interact);
      host.removeEventListener("appinstalled", markInstalled);
      listeners.clear();
    },
  };
}
