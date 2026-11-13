import { expect, it, vi } from "vitest";
import { installScannerShellWorker } from "../browser/scanner-shell-worker";
import { createOfflineQueueRuntime } from "../browser/offline-queue-runtime";
import { createOfflineQueuePolicy } from "../lib/offline-queue";
import { decideAdmission } from "../lib/admission";
import type { GuestSnapshot } from "../lib/guest-snapshot";
type Options = Parameters<typeof installScannerShellWorker>[0];
const session = "a".repeat(64);
const actor = { staffId: "11111111-1111-4111-8111-111111111111", deviceId: "b".repeat(64) };
const invitationId = "22222222-2222-4222-8222-222222222222";
const id = "33333333-3333-4333-8333-333333333333";
function fixture() {
  const policy = createOfflineQueuePolicy();
  const journal = policy.empty();
  let snapshot: GuestSnapshot | null = {
    version: 2,
    actor,
    session,
    generatedAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    keys: [],
    invitations: [
      {
        invitationId,
        tokenVersion: 1,
        status: "rsvp_yes",
        attending: true,
        partySize: 4,
        admittedSoFar: 0,
        name: "Guest",
        names: ["Guest"],
        tableNumber: null,
      },
    ],
  };
  const queueStore = {
    read: async () => structuredClone(journal),
    purgeAcknowledged: async () => {
      const count = journal.receipts.length;
      journal.receipts = [];
      return count;
    },
    record: vi.fn(
      async (
        attempt: Parameters<typeof policy.record>[1],
        allowance: Parameters<typeof policy.record>[2],
      ) => policy.record(journal, attempt, allowance),
    ),
    acknowledge: async (owner: typeof actor, acks: readonly unknown[], generation: string) =>
      policy.acknowledge(journal, owner, acks, generation),
    clearBarrier: async (owner: typeof actor, generation: string) =>
      policy.clearBarrier(journal, owner, generation),
    clearCapturedBarriers: vi.fn(async (captured: typeof journal.barriers) =>
      policy.clearCapturedBarriers(journal, captured),
    ),
  };
  const invalidate = vi.fn(async () => {
    snapshot = null;
  });
  const shellStore = {
    current: async () =>
      snapshot && { session, build: "c".repeat(64), expiresAt: snapshot.expiresAt },
    invalidate,
  } as unknown as ReturnType<Options["store"]>;
  const guestStore = { invalidate, current: async () => snapshot } as unknown as ReturnType<
    NonNullable<Options["guests"]>["store"]
  >;
  const refresh = vi.fn(async () => ({
    state: "unavailable" as "ready" | "unavailable" | "denied",
  }));
  const guestRuntime = {
    read: async (expected: string) => (expected === snapshot?.session ? snapshot : null),
    refresh,
  };
  const runtime = {
    status: async () =>
      snapshot
        ? { state: "ready", session, expiresAt: snapshot.expiresAt }
        : { state: "unavailable" },
  } as ReturnType<Options["runtime"]>;
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        signedOut: false,
        acks: [
          {
            clientEventId: id,
            status: "recorded",
            result: "valid",
            admitted: 1,
            conflict: false,
          },
        ],
      }),
    ),
  );
  let receive: Parameters<Options["host"]["addEventListener"]>[1] = () => {};
  let tail: Promise<unknown> = Promise.resolve();
  const host: Options["host"] = {
    location: { origin: "https://wedding.test" },
    navigator: {
      locks: {
        request: (_name, operation) => {
          const result = tail.then(operation);
          tail = result.catch(() => {});
          return result;
        },
      },
    },
    clients: {
      get: async () => ({
        id: "scanner",
        url: "https://wedding.test/checkin",
        postMessage: () => {},
      }),
      matchAll: async () => [],
    },
    addEventListener: (_type, listener) => {
      receive = listener;
    },
  };
  installScannerShellWorker({
    host,
    store: () => shellStore,
    runtime: () => runtime,
    storage: {
      keys: async () => [],
      delete: async () => true,
      open: async () => {
        throw new Error("unused");
      },
    },
    fetcher,
    build: "c".repeat(64),
    assets: [],
    fallback: async () => new Response(),
    guests: { store: () => guestStore, runtime: () => guestRuntime },
    queue: {
      store: () => queueStore,
      runtime: (read) =>
        createOfflineQueueRuntime({
          policy,
          store: queueStore,
          snapshot: read,
          fetcher,
          origin: host.location.origin,
          decide: decideAdmission,
          verify: async () => ({
            ok: true,
            payload: { v: 1, kid: "test", inv: invitationId, ver: 1, iat: 0 },
          }),
        }),
    },
  });
  async function send(type: string, extra: Record<string, unknown> = {}) {
    let reply: unknown;
    let pending: Promise<unknown> = Promise.resolve();
    receive({
      data: { type, session, ...extra },
      source: { id: "scanner" },
      ports: [
        {
          postMessage: (value) => {
            reply = value;
          },
        },
      ],
      waitUntil: (value) => {
        pending = value;
      },
    });
    await pending;
    return reply;
  }
  const input = {
    session,
    clientEventId: id,
    qr: "signed",
    inputMethod: "qr",
    kind: "admission",
    people: 1,
    nameChecked: false,
  };
  return { send, input, queueStore, journal, refresh, invalidate };
}
it("serializes logout behind the durable write and retains unsynced evidence", async () => {
  const h = fixture();
  const save = h.queueStore.record.getMockImplementation();
  if (!save) throw new Error("fixture");
  let release = () => {};
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  h.queueStore.record.mockImplementationOnce(async (...args) => {
    await hold;
    return save(...args);
  });
  const record = h.send("RECORD_OFFLINE_ATTEMPT", { input: h.input });
  await vi.waitFor(() => expect(h.queueStore.record).toHaveBeenCalled());
  const logout = h.send("INVALIDATE_SCANNER");
  expect(h.invalidate).not.toHaveBeenCalled();
  release();
  expect(await record).toMatchObject({ state: "recorded" });
  expect(await logout).toMatchObject({ state: "removed" });
  expect(h.journal.attempts).toHaveLength(1);
  expect(await h.send("OFFLINE_QUEUE_STATUS")).toEqual({ state: "unavailable" });
});
it("keeps the committed acknowledgement barrier when canonical refresh fails", async () => {
  const h = fixture();
  await h.send("RECORD_OFFLINE_ATTEMPT", { input: h.input });
  expect(await h.send("SYNC_OFFLINE_QUEUE")).toMatchObject({ state: "synced", committed: 1 });
  expect(h.journal.receipts).toHaveLength(1);
  expect(h.journal.barriers).toHaveLength(1);
  expect(h.queueStore.clearCapturedBarriers).not.toHaveBeenCalled();
  expect(
    await h.send("RECORD_OFFLINE_ATTEMPT", {
      input: { ...h.input, clientEventId: "44444444-4444-4444-8444-444444444444" },
    }),
  ).toMatchObject({ state: "refresh_required" });
  h.refresh.mockResolvedValueOnce({ state: "ready" });
  expect(await h.send("REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
  expect(h.journal.barriers).toHaveLength(0);
});
it("overlays local admission counts and refuses stale-session messages", async () => {
  const h = fixture();
  await h.send("RECORD_OFFLINE_ATTEMPT", { input: h.input });
  expect(await h.send("READ_GUEST_SNAPSHOT")).toMatchObject({
    state: "ready",
    snapshot: { invitations: [{ admittedSoFar: 1 }] },
  });
  expect(await h.send("SYNC_OFFLINE_QUEUE", { session: "d".repeat(64) })).toEqual({
    state: "unavailable",
  });
  expect(h.journal.attempts).toHaveLength(1);
});
