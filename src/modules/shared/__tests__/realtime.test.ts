import { createHmac, randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { stationEvents } from "../lib/realtime-channels";
import {
  subscribeStation,
  type RealtimeChannelLike,
  type RealtimeClientLike,
  type TokenResult,
} from "../lib/station-channel";
import { publishToStation } from "../server/realtime-publish";
import { mintStationToken, REALTIME_TOKEN_SECONDS } from "../server/realtime-token";
import { realtimeTokenResponse } from "../server/realtime-token-response";

const secret = "x".repeat(40);

describe("mintStationToken", () => {
  it("signs a short authenticated token whose only privilege is the station claim", () => {
    const now = new Date("2026-11-21T15:00:00Z");
    const { token, expiresAt } = mintStationToken(
      { station: "kitchen", deviceId: "kitchen-tablet" },
      secret,
      now,
    );
    const [header, body, signature] = token.split(".");
    expect(createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url")).toBe(
      signature,
    );
    expect(JSON.parse(Buffer.from(body ?? "", "base64url").toString())).toEqual({
      aud: "authenticated",
      role: "authenticated",
      sub: "kitchen-tablet",
      staff_station: "kitchen",
      iat: now.getTime() / 1000,
      exp: now.getTime() / 1000 + REALTIME_TOKEN_SECONDS,
    });
    expect(expiresAt).toBe("2026-11-21T15:10:00.000Z");
  });
});

describe("realtimeTokenResponse", () => {
  const mint = vi.fn(() => ({ token: "t", expiresAt: "2026-11-21T15:10:00.000Z" }));

  it("gives guests and other stations nothing", async () => {
    const response = await realtimeTokenResponse("kitchen", {
      authorize: async () => null,
      secret,
      mint,
    });
    expect(response.status).toBe(403);
    expect(mint).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("answers 503 when live updates are off or the check fails", async () => {
    expect(
      (await realtimeTokenResponse("bar", { authorize: async () => "d", secret: "", mint })).status,
    ).toBe(503);
    const failing = await realtimeTokenResponse("bar", {
      authorize: async () => {
        throw new Error("db down at 10.0.0.1");
      },
      secret,
      mint,
    });
    expect(failing.status).toBe(503);
    expect(JSON.stringify(await failing.json())).not.toContain("10.0.0.1");
  });

  it("mints for the signed-in device", async () => {
    const response = await realtimeTokenResponse("gate", {
      authorize: async () => "gate-phone",
      secret,
      mint,
    });
    expect(response.status).toBe(200);
    expect(mint).toHaveBeenCalledWith({ station: "gate", deviceId: "gate-phone" }, secret);
  });
});

describe("station payload contract", () => {
  const order = { stationOrderId: randomUUID(), orderId: randomUUID(), status: "received" };

  it("carries ids and statuses only; any extra field such as dietary notes is refused", () => {
    expect(stationEvents.kitchen["order.changed"].safeParse(order).success).toBe(true);
    for (const extra of [{ dietaryNotes: "nut allergy" }, { guestName: "Ada" }, { notes: "x" }])
      expect(stationEvents.kitchen["order.changed"].safeParse({ ...order, ...extra }).success).toBe(
        false,
      );
    expect(
      stationEvents.gate["checkin.recorded"].safeParse({
        invitationId: randomUUID(),
        admitted: 2,
        conflict: false,
        householdName: "The Okafors",
      }).success,
    ).toBe(false);
  });

  it("refuses to publish a payload outside the contract", async () => {
    const execute = vi.fn();
    await expect(
      publishToStation({ execute } as never, "bar", "order.changed", {
        ...order,
        dietaryNotes: "vegan",
      } as never),
    ).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });
});

function fakeClient() {
  const listeners: {
    status: (s: string) => void;
    message: (m: { event: string; payload: unknown }) => void;
  }[] = [];
  const auth: string[] = [];
  const removed: RealtimeChannelLike[] = [];
  const client: RealtimeClientLike = {
    realtime: { setAuth: (token) => void auth.push(token) },
    channel: (topic, options) => {
      expect(topic).toBe("station:kitchen");
      expect(options).toEqual({ config: { private: true } });
      const entry = {
        status: (_: string) => {},
        message: (_: { event: string; payload: unknown }) => {},
      };
      listeners.push(entry);
      const channel: RealtimeChannelLike = {
        on: (_type, _filter, callback) => {
          entry.message = callback;
          return channel;
        },
        subscribe: (callback) => {
          entry.status = callback;
          return channel;
        },
      };
      return channel;
    },
    removeChannel: (channel) => void removed.push(channel),
  };
  return { client, listeners, auth, removed };
}
function manualTimers() {
  const pending: { run: () => void; ms: number; id: number }[] = [];
  let next = 0;
  return {
    pending,
    timers: {
      set: (run: () => void, ms: number) => {
        pending.push({ run, ms, id: ++next });
        return next;
      },
      clear: (handle: unknown) => {
        const index = pending.findIndex((timer) => timer.id === handle);
        if (index >= 0) pending.splice(index, 1);
      },
    },
    fire(ms: number) {
      const index = pending.findIndex((timer) => timer.ms === ms);
      const [timer] = pending.splice(index, 1);
      timer?.run();
    },
  };
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const token = (expiresAt = "2026-11-21T15:10:00.000Z"): TokenResult => ({
  token: { token: "tok-" + expiresAt, expiresAt },
});

describe("subscribeStation", () => {
  it("refetches on every (re)subscribe and delivers only contract payloads", async () => {
    const fake = fakeClient();
    const { timers } = manualTimers();
    const onEvent = vi.fn();
    const onResync = vi.fn();
    const statuses: string[] = [];
    subscribeStation({
      station: "kitchen",
      client: fake.client,
      onEvent,
      onResync,
      onStatus: (status) => statuses.push(status),
      fetchToken: async () => token(),
      timers,
      now: () => Date.parse("2026-11-21T15:00:00Z"),
    });
    await flush();
    const [first] = fake.listeners;
    first?.status("SUBSCRIBED");
    expect(onResync).toHaveBeenCalledTimes(1);
    const payload = {
      id: "msg-1",
      stationOrderId: randomUUID(),
      orderId: randomUUID(),
      status: "ready",
    };
    first?.message({ event: "order.changed", payload });
    first?.message({ event: "order.changed", payload: { ...payload, dietaryNotes: "nuts" } });
    first?.message({
      event: "checkin.recorded",
      payload: { invitationId: null, admitted: 1, conflict: false },
    });
    const { id: _ignored, ...fields } = payload;
    expect(onEvent.mock.calls).toEqual([["order.changed", fields]]);
    // The socket reconnecting rejoins the channel: refetch again so nothing is missed.
    first?.status("SUBSCRIBED");
    expect(onResync).toHaveBeenCalledTimes(2);
    expect(statuses).toEqual(["connecting", "live", "live"]);
  });

  it("after a dropped channel, refetches, backs off and rejoins with a fresh token", async () => {
    const fake = fakeClient();
    const manual = manualTimers();
    const onResync = vi.fn();
    const fetchToken = vi.fn(async () => token());
    subscribeStation({
      station: "kitchen",
      client: fake.client,
      onEvent: () => {},
      onResync,
      fetchToken,
      timers: manual.timers,
      now: () => Date.parse("2026-11-21T15:00:00Z"),
    });
    await flush();
    fake.listeners[0]?.status("CHANNEL_ERROR");
    expect(onResync).toHaveBeenCalledTimes(1);
    expect(fake.removed).toHaveLength(1);
    expect(manual.pending.map((timer) => timer.ms)).toEqual([1_000]);
    manual.fire(1_000);
    await flush();
    expect(fetchToken).toHaveBeenCalledTimes(2);
    fake.listeners[1]?.status("SUBSCRIBED");
    expect(onResync).toHaveBeenCalledTimes(2);
  });

  it("renews the token before it expires and stops when the device is signed out", async () => {
    const fake = fakeClient();
    const manual = manualTimers();
    const results: TokenResult[] = [
      token(),
      token("2026-11-21T15:20:00.000Z"),
      { signedOut: true },
    ];
    const statuses: string[] = [];
    subscribeStation({
      station: "kitchen",
      client: fake.client,
      onEvent: () => {},
      onResync: () => {},
      onStatus: (status) => statuses.push(status),
      fetchToken: async () => results.shift() ?? { unavailable: true },
      timers: manual.timers,
      now: () => Date.parse("2026-11-21T15:00:00Z"),
    });
    await flush();
    // 10 minutes minus the one-minute margin.
    expect(manual.pending.map((timer) => timer.ms)).toEqual([540_000]);
    manual.fire(540_000);
    await flush();
    expect(fake.auth).toEqual(["tok-2026-11-21T15:10:00.000Z", "tok-2026-11-21T15:20:00.000Z"]);
    manual.fire(1_140_000);
    await flush();
    expect(statuses.at(-1)).toBe("signed-out");
    expect(fake.removed).toHaveLength(1);
    expect(manual.pending).toEqual([]);
  });

  it("keeps the board refetching while live updates are unavailable", async () => {
    const fake = fakeClient();
    const manual = manualTimers();
    const onResync = vi.fn();
    subscribeStation({
      station: "kitchen",
      client: fake.client,
      onEvent: () => {},
      onResync,
      fetchToken: async () => ({ unavailable: true }),
      timers: manual.timers,
    });
    await flush();
    expect(onResync).toHaveBeenCalledTimes(1);
    manual.fire(1_000);
    await flush();
    manual.fire(2_000);
    await flush();
    expect(onResync).toHaveBeenCalledTimes(3);
    expect(fake.listeners).toHaveLength(0);
  });
});
