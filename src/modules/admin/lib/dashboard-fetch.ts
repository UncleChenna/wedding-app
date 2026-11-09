import { dashboardSnapshotSchema, type DashboardSnapshot } from "./dashboard";

export type DashboardFetchResult =
  { status: "ready"; snapshot: DashboardSnapshot } | { status: "denied" | "unavailable" };

/** Bound headers and body, including a stalled or non-cooperative transport. */
export async function fetchDashboard(signal: AbortSignal): Promise<DashboardFetchResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort = () => {};
  const stopped = new Promise<never>((_, reject) => {
    abort = () => {
      controller.abort();
      reject(new Error("Dashboard request ended"));
    };
    signal.addEventListener("abort", abort, { once: true });
    timer = setTimeout(abort, 8000);
    if (signal.aborted) abort();
  });
  try {
    return await Promise.race([
      stopped,
      (async (): Promise<DashboardFetchResult> => {
        const response = await fetch("/api/admin/dashboard", {
          cache: "no-store",
          credentials: "same-origin",
          redirect: "error",
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) return { status: "denied" };
        if (!response.ok) return { status: "unavailable" };
        const parsed = dashboardSnapshotSchema.safeParse(await response.json());
        return parsed.success
          ? { status: "ready", snapshot: parsed.data }
          : { status: "unavailable" };
      })(),
    ]);
  } catch {
    return { status: "unavailable" };
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
