import {
  manualResponseSchema,
  type ManualLookupRequest,
  type ManualResponse,
} from "../lib/manual-checkin";

/** Bounded read transport only. Admission uses its own uncertain-retry contract. */
export async function readLiveManual(
  input: ManualLookupRequest,
  signal: AbortSignal,
): Promise<ManualResponse> {
  const transport = new AbortController();
  const abort = () => transport.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  const timer = setTimeout(abort, 5000);
  try {
    const response = await fetch("/api/checkin/manual", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal: transport.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (response.status === 401 || response.status === 403) return { state: "session_expired" };
    const parsed = manualResponseSchema.safeParse(await response.json());
    if (!parsed.success) return { state: "unavailable" };
    const value = parsed.data;
    if (value.state === "matches" && input.operation !== "search") return { state: "unavailable" };
    if (
      value.state === "selection" &&
      (input.operation !== "read" || value.invitationId !== input.invitationId)
    )
      return { state: "unavailable" };
    return value;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
    transport.abort();
  }
}
