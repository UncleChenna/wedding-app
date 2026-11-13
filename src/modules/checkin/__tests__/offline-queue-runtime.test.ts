import { expect, it, vi } from "vitest";
import { createOfflineQueueRuntime } from "../browser/offline-queue-runtime";
import { createOfflineQueuePolicy } from "../lib/offline-queue";
import { decideAdmission } from "../lib/admission";
import type { GatePassVerification } from "../lib/gate-token";
import type { GuestSnapshot } from "../lib/guest-snapshot";
const actor = { staffId: "11111111-1111-4111-8111-111111111111", deviceId: "a".repeat(64) };
const invitationId = "22222222-2222-4222-8222-222222222222";
const id = "33333333-3333-4333-8333-333333333333";
const session = "b".repeat(64);
function setup() {
  const policy = createOfflineQueuePolicy();
  const state = policy.empty();
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
        partySize: 2,
        admittedSoFar: 0,
        name: "Guest",
        names: ["Guest"],
        tableNumber: 1,
      },
    ],
  };
  const store = {
    read: async () => structuredClone(state),
    record: vi.fn(
      async (
        ...args: Parameters<ReturnType<typeof createOfflineQueuePolicy>["record"]> extends [
          unknown,
          ...infer P,
        ]
          ? P
          : never
      ) => policy.record(state, ...args),
    ),
    acknowledge: async (owner: typeof actor, acks: readonly unknown[], generation: string) =>
      policy.acknowledge(state, owner, acks, generation),
    purgeAcknowledged: async () => {
      const count = state.receipts.length;
      state.receipts = [];
      return count;
    },
    clearBarrier: async () => false,
    clearCapturedBarriers: async () => 0,
  };
  const verify = vi.fn<() => Promise<GatePassVerification>>(async () => ({
    ok: true as const,
    payload: { v: 1 as const, kid: "test", inv: invitationId, ver: 1, iat: 0 },
  }));
  const fetcher = vi.fn<typeof fetch>();
  const runtime = createOfflineQueueRuntime({
    policy,
    store,
    snapshot: async () => snapshot,
    verify,
    decide: decideAdmission,
    fetcher,
    origin: "https://wedding.test",
  });
  const input = {
    session,
    clientEventId: id,
    qr: "signed",
    inputMethod: "qr",
    kind: "admission",
    people: 1,
    nameChecked: false,
  };
  return {
    runtime,
    input,
    state,
    store,
    verify,
    fetcher,
    setSnapshot: (value: GuestSnapshot | null) => {
      snapshot = value;
    },
    getSnapshot: () => snapshot,
  };
}
it("verifies the pass inside the worker and waits for durable commit before success", async () => {
  const h = setup();
  let release = () => {};
  h.store.record.mockImplementationOnce(
    async () =>
      new Promise((resolve) => {
        release = () => resolve("recorded");
      }),
  );
  let complete = false;
  const result = h.runtime.record(h.input).then((value) => {
    complete = true;
    return value;
  });
  await vi.waitFor(() => expect(h.store.record).toHaveBeenCalled());
  expect(complete).toBe(false);
  expect(h.verify).toHaveBeenCalled();
  release();
  expect(await result).toMatchObject({ state: "recorded", clientEventId: id });
});
it("does not trust a supplied verdict and refuses old v1 snapshots and expired verification", async () => {
  const h = setup();
  expect(await h.runtime.record({ ...h.input, verdict: "valid" })).toEqual({
    state: "unavailable",
  });
  const snapshot = h.getSnapshot();
  if (!snapshot) throw new Error("fixture");
  h.setSnapshot({ ...snapshot, version: 1, actor: undefined });
  expect(await h.runtime.record(h.input)).toEqual({ state: "unavailable" });
  h.setSnapshot(snapshot);
  h.verify.mockImplementationOnce(async () => {
    h.setSnapshot(null);
    return { ok: true, payload: { v: 1, kid: "test", inv: invitationId, ver: 1, iat: 0 } };
  });
  expect(await h.runtime.record(h.input)).toEqual({ state: "unavailable" });
  expect(h.state.attempts).toHaveLength(0);
});
it("records invalid observations without persisting QR text or private names", async () => {
  const h = setup();
  h.verify.mockResolvedValueOnce({ ok: false, reason: "bad-signature" });
  expect(await h.runtime.record({ ...h.input, kind: "observation", people: 0 })).toMatchObject({
    state: "recorded",
    result: "invalid",
  });
  expect(h.state.attempts[0]?.event).toMatchObject({ invitationId: null, reportedPeople: 0 });
  expect(JSON.stringify(h.state)).not.toContain("signed");
  expect(JSON.stringify(h.state)).not.toContain("Guest");
});
it("preserves exact intent on replay and counts all local admissions", async () => {
  const h = setup();
  expect(await h.runtime.record(h.input)).toMatchObject({ state: "recorded" });
  expect(await h.runtime.record(h.input)).toMatchObject({ state: "duplicate" });
  expect(
    await h.runtime.record({
      ...h.input,
      clientEventId: "44444444-4444-4444-8444-444444444444",
      people: 2,
    }),
  ).toMatchObject({ state: "too_many" });
  expect(h.state.attempts).toHaveLength(1);
});
it("permits an unknown signed pass only after explicit name checking", async () => {
  const h = setup();
  const snapshot = h.getSnapshot();
  if (!snapshot) throw new Error("fixture");
  h.setSnapshot({ ...snapshot, invitations: [] });
  expect(await h.runtime.record(h.input)).toMatchObject({ state: "name_check_required" });
  expect(await h.runtime.record({ ...h.input, nameChecked: true })).toMatchObject({
    state: "recorded",
  });
});
it("uploads only original-operator attempts and persists acknowledgements with a refresh barrier", async () => {
  const h = setup();
  await h.runtime.record(h.input);
  h.fetcher.mockResolvedValue(
    new Response(
      JSON.stringify({
        signedOut: false,
        acks: [
          { clientEventId: id, status: "recorded", result: "valid", admitted: 1, conflict: false },
        ],
      }),
    ),
  );
  expect(await h.runtime.sync(session)).toMatchObject({ state: "synced", committed: 1 });
  expect(h.state.attempts).toHaveLength(0);
  expect(h.state.receipts).toHaveLength(1);
  expect(h.state.barriers).toHaveLength(1);
  const body = JSON.parse(String(h.fetcher.mock.calls[0]?.[1]?.body));
  expect(body.expectedActor).toEqual(actor);
  expect(body.events[0].clientEventId).toBe(id);
});
it("never removes evidence on network failure or mismatched acknowledgement", async () => {
  const h = setup();
  await h.runtime.record(h.input);
  h.fetcher.mockRejectedValueOnce(new Error("offline"));
  expect(await h.runtime.sync(session)).toMatchObject({ state: "unavailable" });
  h.fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ signedOut: false, acks: [] })));
  expect(await h.runtime.sync(session)).toMatchObject({ state: "unavailable" });
  expect(h.state.attempts).toHaveLength(1);
});
it("records explicit manual selections only from the current snapshot without fabricated QR", async () => {
  const h = setup();
  const { qr: _qr, ...base } = h.input;
  const manual = { ...base, inputMethod: "manual", invitationId };
  expect(await h.runtime.record(manual)).toMatchObject({ state: "recorded" });
  expect(h.verify).not.toHaveBeenCalled();
  expect(h.state.attempts[0]?.event).toMatchObject({
    invitationId,
    inputMethod: "manual",
    reportedPeople: 1,
  });
  expect(
    await h.runtime.record({
      ...manual,
      clientEventId: "44444444-4444-4444-8444-444444444444",
      invitationId: "55555555-5555-4555-8555-555555555555",
      nameChecked: true,
    }),
  ).toMatchObject({ state: "refused", result: "invalid" });
});
