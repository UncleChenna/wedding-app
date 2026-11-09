import {
  realtimeTokenSchema,
  stationEvents,
  stationTopic,
  type RealtimeToken,
  type Station,
} from "./realtime-channels";

/** The slice of the Supabase Realtime client this helper uses, so tests can drive it. */
export type RealtimeClientLike = {
  realtime: { setAuth: (token: string) => Promise<void> | void };
  channel: (topic: string, options: { config: { private: true } }) => RealtimeChannelLike;
  removeChannel: (channel: RealtimeChannelLike) => unknown;
};
export type RealtimeChannelLike = {
  on: (
    type: "broadcast",
    filter: { event: "*" },
    callback: (message: { event: string; payload: unknown }) => void,
  ) => RealtimeChannelLike;
  subscribe: (callback: (status: string) => void) => RealtimeChannelLike;
};

/** `live`: receiving. `reconnecting`: refetch on a timer until live. `signed-out`: stopped. */
export type StationChannelStatus = "connecting" | "live" | "reconnecting" | "signed-out";
export type TokenResult = { token: RealtimeToken } | { signedOut: true } | { unavailable: true };

const tokenPaths: Record<Station, string> = {
  gate: "/api/checkin/realtime-token",
  kitchen: "/api/kitchen/realtime-token",
  bar: "/api/bar/realtime-token",
};

export async function fetchStationToken(station: Station): Promise<TokenResult> {
  try {
    const response = await fetch(tokenPaths[station], { method: "POST", cache: "no-store" });
    if (response.status === 401 || response.status === 403) return { signedOut: true };
    const parsed = realtimeTokenSchema.safeParse(response.ok ? await response.json() : null);
    return parsed.success ? { token: parsed.data } : { unavailable: true };
  } catch {
    return { unavailable: true };
  }
}

type Options = {
  station: Station;
  client: RealtimeClientLike;
  /** Called with each validated notification. */
  onEvent: (event: string, payload: unknown) => void;
  /**
   * Refetch the board from its REST endpoint. Called on every (re)subscribe, and on a timer while
   * live updates are unavailable, so a dropped connection never leaves a gap.
   */
  onResync: () => void;
  onStatus?: (status: StationChannelStatus) => void;
  fetchToken?: (station: Station) => Promise<TokenResult>;
  timers?: { set: (run: () => void, ms: number) => unknown; clear: (handle: unknown) => void };
  now?: () => number;
};

const BACKOFF_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
/** Refresh a token this long before it expires. */
const REFRESH_EARLY_MS = 60_000;

/** Subscribes a staff screen to its station topic (ADR 0024). Returns `stop`. */
export function subscribeStation({
  station,
  client,
  onEvent,
  onResync,
  onStatus = () => {},
  fetchToken = fetchStationToken,
  timers = {
    set: (run, ms) => setTimeout(run, ms),
    clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  },
  now = () => Date.now(),
}: Options): () => void {
  let stopped = false;
  let attempt = 0;
  let channel: RealtimeChannelLike | null = null;
  let retry: unknown = null;
  let refresh: unknown = null;
  const events: Record<string, { safeParse: (value: unknown) => { success: boolean } }> =
    stationEvents[station];

  const setStatus = (status: StationChannelStatus) => {
    if (!stopped) onStatus(status);
  };
  const clearTimers = () => {
    if (retry !== null) timers.clear(retry);
    if (refresh !== null) timers.clear(refresh);
    retry = refresh = null;
  };
  const dropChannel = () => {
    // Clear first: removing a channel fires its CLOSED callback, which must not retry again.
    const current = channel;
    channel = null;
    if (current) client.removeChannel(current);
  };
  const scheduleRetry = () => {
    if (stopped) return;
    dropChannel();
    setStatus("reconnecting");
    onResync();
    const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)] ?? 30_000;
    attempt += 1;
    retry = timers.set(() => void connect(), delay);
  };
  const scheduleRefresh = (token: RealtimeToken) => {
    const wait = Math.max(5_000, Date.parse(token.expiresAt) - now() - REFRESH_EARLY_MS);
    refresh = timers.set(() => void renew(), wait);
  };
  const handleToken = (result: TokenResult): RealtimeToken | null => {
    if ("token" in result) return result.token;
    if ("signedOut" in result) {
      setStatus("signed-out");
      stop();
    } else scheduleRetry();
    return null;
  };

  async function renew() {
    refresh = null;
    const token = handleToken(await fetchToken(station));
    if (!token || stopped) return;
    await client.realtime.setAuth(token.token);
    scheduleRefresh(token);
  }

  async function connect() {
    retry = null;
    if (stopped) return;
    const token = handleToken(await fetchToken(station));
    if (!token || stopped) return;
    await client.realtime.setAuth(token.token);
    scheduleRefresh(token);
    const current: RealtimeChannelLike = client
      .channel(stationTopic(station), { config: { private: true } })
      .on("broadcast", { event: "*" }, ({ event, payload }) => {
        const schema = events[event];
        if (!schema || typeof payload !== "object" || payload === null) return;
        // realtime.send adds a message id; the contract covers only our own fields.
        const fields: Record<string, unknown> = { ...payload };
        delete fields.id;
        if (schema.safeParse(fields).success) onEvent(event, fields);
      })
      .subscribe((status) => {
        // Ignore a replaced or removed channel's late callbacks.
        if (stopped || channel !== current) return;
        if (status === "SUBSCRIBED") {
          attempt = 0;
          setStatus("live");
          // Anything written while disconnected (or before this join) arrives through the refetch.
          onResync();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (refresh !== null) timers.clear(refresh);
          refresh = null;
          scheduleRetry();
        }
      });
    channel = current;
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimers();
    dropChannel();
  }

  setStatus("connecting");
  void connect();
  return stop;
}
