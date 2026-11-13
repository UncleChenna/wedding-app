import {
  discriminatedUnion,
  strictObject,
  literal,
  int,
  positive,
  type infer as Infer,
} from "zod/mini";

const replySchema = discriminatedUnion("state", [
  strictObject({ state: literal("ready"), pending: literal(0) }),
  strictObject({ state: literal("deferred"), pending: int().check(positive()) }),
  strictObject({ state: literal("unavailable") }),
]);
export type UpdateReply = Infer<typeof replySchema>;
export type UpdateView = UpdateReply | { state: "hidden" | "checking" | "updating" };
export function parseUpdateReply(value: unknown): UpdateReply {
  const result = replySchema.safeParse(value);
  return result.success ? result.data : { state: "unavailable" };
}
export async function reloadWithEmptyQueue({
  locks,
  read,
  reload,
}: {
  locks?: { request<T>(name: string, operation: () => Promise<T>): Promise<T> };
  read(): Promise<{ attempts: readonly unknown[] }>;
  reload(): void;
}): Promise<UpdateReply> {
  if (!locks) return { state: "unavailable" };
  try {
    return await locks.request("wedding-scanner-shell-publication-v1", async () => {
      const journal = await read();
      if (journal.attempts.length) return { state: "deferred", pending: journal.attempts.length };
      reload();
      return { state: "ready", pending: 0 };
    });
  } catch {
    return { state: "unavailable" };
  }
}
export function requestWorkerUpdate(
  worker: Pick<ServiceWorker, "postMessage">,
  type: "WORKER_UPDATE_STATUS" | "ACTIVATE_WORKER_UPDATE",
): Promise<UpdateReply> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (value: UpdateReply) => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve(value);
    };
    const timer = setTimeout(() => finish({ state: "unavailable" }), 4000);
    channel.port1.onmessage = (event: MessageEvent<unknown>) =>
      finish(parseUpdateReply(event.data));
    channel.port1.onmessageerror = () => finish({ state: "unavailable" });
    try {
      worker.postMessage({ type }, [channel.port2]);
    } catch {
      finish({ state: "unavailable" });
    }
  });
}

/** A click requests activation; other tabs never trigger an automatic reload. */
export function watchWorkerUpdates(
  registration: ServiceWorkerRegistration,
  container: ServiceWorkerContainer,
  publish: (value: UpdateView) => void,
  reloadSafely: () => Promise<UpdateReply>,
) {
  let disposed = false,
    busy = false,
    generation = 0,
    changedController = false;
  let dismissed: ServiceWorker | null = null;
  let previousController = container.controller;
  let watchedInstaller: ServiceWorker | null = null;
  const target = () => registration.waiting ?? (changedController ? container.controller : null);
  async function refresh() {
    if (disposed || busy) return;
    const worker = target();
    const current = ++generation;
    if (!worker || worker === dismissed) {
      publish({ state: "hidden" });
      return;
    }
    const result = await requestWorkerUpdate(worker, "WORKER_UPDATE_STATUS");
    if (!disposed && !busy && current === generation && target() === worker) publish(result);
  }
  function controllerChanged() {
    if (previousController && container.controller !== previousController) changedController = true;
    previousController = container.controller;
    void refresh();
  }
  function updateFound() {
    watchedInstaller?.removeEventListener("statechange", refresh);
    watchedInstaller = registration.installing;
    watchedInstaller?.addEventListener("statechange", refresh);
    void refresh();
  }
  container.addEventListener("controllerchange", controllerChanged);
  registration.addEventListener("updatefound", updateFound);
  const windowHost = typeof window === "undefined" ? undefined : window;
  const documentHost = typeof document === "undefined" ? undefined : document;
  const visible = () => {
    if (documentHost?.visibilityState === "visible") void refresh();
  };
  windowHost?.addEventListener("focus", refresh);
  windowHost?.addEventListener("online", refresh);
  documentHost?.addEventListener("visibilitychange", visible);
  const timer = setInterval(() => {
    void refresh();
  }, 10000);
  updateFound();
  return {
    refresh,
    dismiss() {
      dismissed = target();
      generation += 1;
      publish({ state: "hidden" });
    },
    async accept() {
      const worker = target();
      if (disposed || busy || !worker) return;
      busy = true;
      generation += 1;
      publish({ state: "updating" });
      let removeListener = () => {};
      let activationTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        if (registration.waiting === worker) {
          // Observe before messaging: controllerchange may arrive before the port reply.
          const controlled = new Promise<boolean>((resolve) => {
            const check = () => {
              if (container.controller === worker) resolve(true);
            };
            container.addEventListener("controllerchange", check);
            removeListener = () => container.removeEventListener("controllerchange", check);
            activationTimer = setTimeout(() => resolve(false), 5000);
            check();
          });
          const result = await requestWorkerUpdate(worker, "ACTIVATE_WORKER_UPDATE");
          if (disposed) return;
          if (result.state !== "ready") {
            publish(result);
            return;
          }
          if (!(await controlled)) {
            if (!disposed) publish({ state: "unavailable" });
            return;
          }
        }
        // Recheck under the same lock used by admission publication, after activation.
        if (!disposed) {
          const result = await reloadSafely();
          if (!disposed) publish(result);
        }
      } catch {
        if (!disposed) publish({ state: "unavailable" });
      } finally {
        clearTimeout(activationTimer);
        removeListener();
        busy = false;
      }
    },
    dispose() {
      disposed = true;
      generation += 1;
      clearInterval(timer);
      watchedInstaller?.removeEventListener("statechange", refresh);
      container.removeEventListener("controllerchange", controllerChanged);
      registration.removeEventListener("updatefound", updateFound);
      windowHost?.removeEventListener("focus", refresh);
      windowHost?.removeEventListener("online", refresh);
      documentHost?.removeEventListener("visibilitychange", visible);
    },
  };
}
