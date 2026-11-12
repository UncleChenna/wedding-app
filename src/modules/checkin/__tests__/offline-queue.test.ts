import { expect, it } from "vitest";
import { createOfflineQueuePolicy, type OfflineAttempt } from "../lib/offline-queue";

const actor = { staffId: "11111111-1111-4111-8111-111111111111", deviceId: "a".repeat(64) };
const invitationId = "22222222-2222-4222-8222-222222222222";
const policy = createOfflineQueuePolicy();
function attempt(id = "33333333-3333-4333-8333-333333333333", people = 1): OfflineAttempt {
  return {
    actor,
    session: "b".repeat(64),
    rejected: false,
    event: {
      clientEventId: id,
      invitationId,
      passVersion: 1,
      reportedAt: "2026-12-19T12:00:00.000Z",
      reportedResult: "valid",
      reportedPeople: people,
      kind: "admission",
      inputMethod: "qr",
    },
  };
}
it("persists immutable local intent and counts pending places without duplicate increments", () => {
  const state = policy.empty();
  expect(policy.record(state, attempt(), { kind: "known", remaining: 2 })).toBe("recorded");
  expect(policy.record(state, attempt(), { kind: "known", remaining: 2 })).toBe("duplicate");
  expect(policy.pendingPeople(state, invitationId)).toBe(1);
  expect(policy.record(state, attempt(undefined, 2), { kind: "known", remaining: 2 })).toBe(
    "rejected",
  );
  expect(state.attempts).toHaveLength(1);
});
it("bounds admission by all pending local places and retains refusals with zero places", () => {
  const state = policy.empty();
  policy.record(state, attempt(undefined, 2), { kind: "known", remaining: 2 });
  expect(
    policy.record(state, attempt("44444444-4444-4444-8444-444444444444"), {
      kind: "known",
      remaining: 2,
    }),
  ).toBe("too_many");
  const refused = attempt("55555555-5555-4555-8555-555555555555", 0);
  refused.event.reportedResult = "revoked";
  refused.event.kind = "observation";
  expect(policy.record(state, refused, { kind: "known", remaining: 0 })).toBe("recorded");
  expect(policy.pendingPeople(state, invitationId)).toBe(2);
});
it("removes only committed acknowledgements and establishes a durable refresh barrier", () => {
  const state = policy.empty();
  const first = attempt();
  const second = attempt("44444444-4444-4444-8444-444444444444");
  policy.record(state, first, { kind: "known", remaining: 2 });
  policy.record(state, second, { kind: "known", remaining: 2 });
  expect(
    policy.acknowledge(
      state,
      actor,
      [
        {
          clientEventId: first.event.clientEventId,
          status: "recorded",
          result: "valid",
          admitted: 1,
          conflict: false,
        },
        { clientEventId: second.event.clientEventId, status: "retry" },
      ],
      "66666666-6666-4666-8666-666666666666",
    ),
  ).toBe(true);
  expect(state.attempts.map((row) => row.event.clientEventId)).toEqual([
    second.event.clientEventId,
  ]);
  expect(state.receipts).toHaveLength(1);
  expect(policy.barrier(state, actor)).toBe("66666666-6666-4666-8666-666666666666");
  expect(policy.clearBarrier(state, actor, "77777777-7777-4777-8777-777777777777")).toBe(false);
  expect(policy.clearBarrier(state, actor, "66666666-6666-4666-8666-666666666666")).toBe(true);
});
it("does not erase attempts for another operator or malformed/unknown acknowledgements", () => {
  const state = policy.empty();
  policy.record(state, attempt(), { kind: "known", remaining: 1 });
  const before = structuredClone(state);
  const ack = {
    clientEventId: attempt().event.clientEventId,
    status: "recorded" as const,
    result: "valid" as const,
    admitted: 1,
    conflict: false,
  };
  expect(policy.acknowledge(state, { ...actor, staffId: invitationId }, [ack], invitationId)).toBe(
    false,
  );
  expect(policy.acknowledge(state, actor, [{ ...ack, admitted: 2 }], invitationId)).toBe(false);
  expect(
    policy.acknowledge(state, actor, [{ ...ack, clientEventId: invitationId }], invitationId),
  ).toBe(false);
  expect(state).toEqual(before);
});
it("retains rejected events and validates a minimal durable shape without secrets", () => {
  const state = policy.empty();
  policy.record(state, attempt(), { kind: "known", remaining: 1 });
  expect(
    policy.acknowledge(
      state,
      actor,
      [{ clientEventId: attempt().event.clientEventId, status: "rejected" }],
      invitationId,
    ),
  ).toBe(true);
  expect(state.attempts[0]?.rejected).toBe(true);
  expect(policy.parse(JSON.parse(JSON.stringify(state)))).toEqual(state);
  expect(policy.parse({ ...state, token: "private" })).toBeNull();
  expect(
    policy.parse({ ...state, attempts: [{ ...attempt(), email: "private@example.test" }] }),
  ).toBeNull();
  expect(policy.parse({ ...state, attempts: [attempt(), attempt()] })).toBeNull();
});

it("keeps local allowance conservative across operator changes and acknowledgement barriers", () => {
  const state = policy.empty();
  policy.record(state, attempt(), { kind: "known", remaining: 1 });
  const other = attempt("44444444-4444-4444-8444-444444444444");
  other.actor = { ...actor, staffId: invitationId };
  expect(policy.record(state, other, { kind: "known", remaining: 1 })).toBe("too_many");
  policy.acknowledge(
    state,
    actor,
    [
      {
        clientEventId: attempt().event.clientEventId,
        status: "recorded",
        result: "valid",
        admitted: 1,
        conflict: false,
      },
    ],
    invitationId,
  );
  expect(policy.record(state, other, { kind: "known", remaining: 1 })).toBe("refresh_required");
  const observation = {
    ...other,
    event: { ...other.event, kind: "observation" as const, reportedPeople: 0 },
  };
  expect(policy.record(state, observation, { kind: "known", remaining: 0 })).toBe("recorded");
});

it("rejects malformed durable envelopes and nested private or unbounded fields", () => {
  const state = policy.empty();
  policy.record(state, attempt(), { kind: "known", remaining: 2 });
  const invalid = [
    null,
    [],
    {},
    { ...state, version: 2 },
    { ...state, attempts: null },
    { ...state, receipts: null },
    { ...state, barriers: null },
    { ...state, attempts: [{ ...attempt(), actor: { ...actor, email: "private" } }] },
    { ...state, attempts: [{ ...attempt(), actor: { ...actor, staffId: "not-a-uuid" } }] },
    { ...state, attempts: [{ ...attempt(), actor: { ...actor, deviceId: "credential" } }] },
    { ...state, attempts: [{ ...attempt(), session: "credential" }] },
    { ...state, attempts: [{ ...attempt(), rejected: "yes" }] },
    { ...state, attempts: [{ ...attempt(), event: null }] },
  ];
  for (const value of invalid) expect(policy.parse(value)).toBeNull();
  for (const patch of [
    { token: "private" },
    { clientEventId: "bad" },
    { invitationId: "bad" },
    { passVersion: 0 },
    { passVersion: 1_000_001 },
    { reportedAt: "2026-02-30T12:00:00.000Z" },
    { reportedAt: "invalid" },
    { reportedAt: "x".repeat(41) },
    { reportedResult: "unknown" },
    { reportedPeople: 51 },
    { reportedPeople: -1 },
    { reportedPeople: 0 },
    { inputMethod: "other" },
    { kind: "other" },
    { kind: "observation" },
  ])
    expect(
      policy.parse({
        ...state,
        attempts: [{ ...attempt(), event: { ...attempt().event, ...patch } }],
      }),
    ).toBeNull();
});
it("validates retained receipts and barrier generations without losing conflict evidence", () => {
  const state = policy.empty();
  policy.record(state, attempt(undefined, 2), { kind: "known", remaining: 2 });
  policy.acknowledge(
    state,
    actor,
    [
      {
        clientEventId: attempt().event.clientEventId,
        status: "recorded",
        result: "valid",
        admitted: 1,
        conflict: true,
      },
    ],
    invitationId,
  );
  expect(policy.parse(state)).toEqual(state);
  const receipt = state.receipts[0];
  for (const value of [
    null,
    { ...receipt, private: "secret" },
    { ...receipt, result: "unknown" },
    { ...receipt, admitted: 3 },
    { ...receipt, conflict: false },
    { ...receipt, result: "revoked" },
  ]) {
    expect(policy.parse({ ...state, receipts: [value] })).toBeNull();
  }
  for (const barriers of [
    [null],
    [{ actor, generation: "bad" }],
    [{ actor, generation: invitationId, extra: true }],
    [{ actor: { ...actor, deviceId: "bad" }, generation: invitationId }],
    [...state.barriers, ...state.barriers],
  ])
    expect(policy.parse({ ...state, barriers })).toBeNull();
  expect(policy.record(state, attempt(undefined, 2), { kind: "known", remaining: 2 })).toBe(
    "duplicate",
  );
});
it("validates an entire acknowledgement batch before applying any mutation", () => {
  const state = policy.empty();
  policy.record(state, attempt(), { kind: "known", remaining: 1 });
  const ack = {
    clientEventId: attempt().event.clientEventId,
    status: "recorded",
    result: "valid",
    admitted: 1,
    conflict: false,
  };
  const before = structuredClone(state);
  for (const acks of [
    [],
    [ack, ack],
    [ack, { clientEventId: invitationId, status: "retry" }],
    [null],
    [{ ...ack, status: "other" }],
    [{ ...ack, extra: true }],
    [{ ...ack, result: "invalid" }],
    [{ ...ack, admitted: 0 }],
    [{ clientEventId: ack.clientEventId, status: "retry", extra: true }],
  ])
    expect(policy.acknowledge(state, actor, acks, invitationId)).toBe(false);
  expect(policy.acknowledge(state, actor, [ack], "bad")).toBe(false);
  expect(policy.acknowledge(state, { ...actor, deviceId: "bad" }, [ack], invitationId)).toBe(false);
  expect(state).toEqual(before);
});
it("allows only the explicitly bounded unknown allowance and never drops a full journal", () => {
  const state = policy.empty();
  expect(policy.record(state, attempt(), { kind: "known", remaining: -1 })).toBe("rejected");
  expect(
    policy.record(state, { ...attempt(), rejected: true }, { kind: "known", remaining: 1 }),
  ).toBe("rejected");
  expect(policy.record(state, attempt(), { kind: "name-checked-unknown" })).toBe("recorded");
  const full = policy.empty();
  full.attempts = Array.from({ length: 10_000 }, (_, index) =>
    attempt(`${index.toString(16).padStart(8, "0")}-3333-4333-8333-333333333333`),
  );
  expect(policy.parse(full)).toEqual(full);
  expect(policy.record(full, attempt(), { kind: "known", remaining: 10_001 })).toBe("full");
  expect(full.attempts).toHaveLength(10_000);
  expect(policy.parse({ ...full, attempts: [...full.attempts, attempt()] })).toBeNull();
});

it("never records positive admission without a verified invitation identity", () => {
  const state = policy.empty();
  const value = attempt();
  value.event.invitationId = null;
  expect(policy.record(state, value, { kind: "name-checked-unknown" })).toBe("rejected");
  expect(state.attempts).toEqual([]);
  expect(policy.parse({ ...state, attempts: [value] })).toBeNull();
});
it("a fresh canonical snapshot can clear captured barriers across operators without clearing newer acknowledgements", () => {
  const state = policy.empty();
  policy.record(state, attempt(), { kind: "known", remaining: 1 });
  policy.acknowledge(
    state,
    actor,
    [
      {
        clientEventId: attempt().event.clientEventId,
        status: "recorded",
        result: "valid",
        admitted: 1,
        conflict: false,
      },
    ],
    invitationId,
  );
  const captured = structuredClone(state.barriers);
  state.barriers.push({
    actor: { ...actor, staffId: "44444444-4444-4444-8444-444444444444" },
    generation: "55555555-5555-4555-8555-555555555555",
  });
  expect(policy.clearCapturedBarriers(state, captured)).toBe(1);
  expect(state.barriers).toHaveLength(1);
  expect(policy.clearCapturedBarriers(state, captured)).toBe(0);
  expect(policy.clearCapturedBarriers(state, structuredClone(state.barriers))).toBe(1);
  expect(state.receipts).toHaveLength(1);
});
