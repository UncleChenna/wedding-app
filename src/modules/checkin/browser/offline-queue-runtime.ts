import type { createOfflineQueueStore } from "./offline-queue-store";
import type {
  createOfflineQueuePolicy,
  OfflineAllowance,
  OfflineAttempt,
  OfflineVerdict,
} from "../lib/offline-queue";
import type { GuestSnapshot } from "../lib/guest-snapshot";
import type { GatePassVerification, GatePublicKey } from "../lib/gate-token";
import type { decideAdmission } from "../lib/admission";

interface Options {
  policy: ReturnType<typeof createOfflineQueuePolicy>;
  store: ReturnType<typeof createOfflineQueueStore>;
  snapshot: (session: string) => Promise<GuestSnapshot | null>;
  verify: (qr: string, keys: readonly GatePublicKey[]) => Promise<GatePassVerification>;
  decide: typeof decideAdmission;
  fetcher: typeof fetch;
  origin: string;
}

/** Worker-only. Caller holds the scanner's origin lock for the entire operation. */
export function createOfflineQueueRuntime(options: Options) {
  const { policy, store } = options;
  const object = (value: unknown): Record<string, unknown> | null =>
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  const unavailable = () => ({ state: "unavailable" as const });
  async function current(session: string) {
    const snapshot = await options.snapshot(session);
    return snapshot?.version === 2 &&
      snapshot.actor &&
      snapshot.session === session &&
      snapshot.expiresAt > Date.now()
      ? snapshot
      : null;
  }
  async function status(session: string) {
    const snapshot = await current(session);
    if (!snapshot?.actor) return unavailable();
    const actor = snapshot.actor;
    const state = await store.read();
    const own = state.attempts.filter((row) => policy.sameActor(row.actor, actor));
    return {
      state: "ready" as const,
      pending: own.filter((row) => !row.rejected).length,
      rejected: own.filter((row) => row.rejected).length,
      otherOperator: state.attempts.length - own.length,
      conflicts: state.receipts.filter(
        (row) => policy.sameActor(row.attempt.actor, actor) && row.conflict,
      ).length,
      refreshRequired: state.barriers.length > 0,
    };
  }
  async function record(value: unknown) {
    const input = object(value);
    const fields = [
      "session",
      "clientEventId",
      "qr",
      "inputMethod",
      "kind",
      "people",
      "nameChecked",
    ];
    if (
      !input ||
      Object.keys(input).length !== fields.length ||
      Object.keys(input).some((key) => !fields.includes(key)) ||
      typeof input.session !== "string" ||
      !/^[a-f0-9]{64}$/.test(input.session) ||
      typeof input.clientEventId !== "string" ||
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(input.clientEventId) ||
      typeof input.qr !== "string" ||
      input.qr.length > 2048 ||
      input.inputMethod !== "qr" ||
      (input.kind !== "observation" && input.kind !== "admission") ||
      typeof input.people !== "number" ||
      !Number.isSafeInteger(input.people) ||
      input.people < 0 ||
      input.people > 50 ||
      (input.kind === "observation" ? input.people !== 0 : input.people < 1) ||
      typeof input.nameChecked !== "boolean"
    )
      return unavailable();
    const snapshot = await current(input.session);
    if (!snapshot?.actor) return unavailable();
    const actor = snapshot.actor;
    const verified = await options.verify(input.qr, snapshot.keys);
    // Signature verification is asynchronous; expiry/replacement must still fail closed.
    const after = await current(input.session);
    if (!after?.actor || !policy.sameActor(after.actor, actor)) return unavailable();
    const invitationId = verified.ok ? verified.payload.inv.toLowerCase() : null;
    const passVersion = verified.ok ? verified.payload.ver : 1;
    const row = after.invitations.find((item) => item.invitationId.toLowerCase() === invitationId);
    const state = await store.read();
    const existing =
      state.attempts.find((item) => item.event.clientEventId === input.clientEventId) ??
      state.receipts.find((item) => item.attempt.event.clientEventId === input.clientEventId)
        ?.attempt;
    // A retry keeps the original event time/result, but cannot change its identity/count/method.
    if (existing) {
      if (
        existing.rejected ||
        !policy.sameActor(existing.actor, actor) ||
        existing.session !== input.session ||
        existing.event.invitationId !== invitationId ||
        existing.event.passVersion !== passVersion ||
        existing.event.reportedPeople !== input.people ||
        existing.event.kind !== input.kind ||
        existing.event.inputMethod !== input.inputMethod
      )
        return { state: "rejected" as const };
      return {
        state: "duplicate" as const,
        clientEventId: input.clientEventId,
        result: existing.event.reportedResult,
        people: existing.event.reportedPeople,
      };
    }
    let result: OfflineVerdict = "invalid";
    let allowance: OfflineAllowance = { kind: "known", remaining: 0 };
    if (verified.ok && row) {
      const decision = options.decide({
        invitation: {
          status: row.status,
          tokenVersion: row.tokenVersion,
          attending: row.attending,
          countAttending: row.partySize,
        },
        passVersion,
        admittedSoFar: row.admittedSoFar + policy.pendingPeople(state, row.invitationId),
        ...(input.kind === "admission" ? { requested: input.people } : {}),
      });
      if (decision.result === "too_many" || decision.result === "bad_count")
        return { state: decision.result };
      result = decision.result;
      allowance = { kind: "known", remaining: Math.max(0, row.partySize - row.admittedSoFar) };
    } else if (verified.ok && input.kind === "admission") {
      if (!input.nameChecked) return { state: "name_check_required" as const };
      result = "valid";
      allowance = { kind: "name-checked-unknown" };
    }
    if (input.kind === "admission" && result !== "valid")
      return { state: "refused" as const, result };
    const attempt: OfflineAttempt = {
      actor,
      session: input.session,
      rejected: false,
      event: {
        clientEventId: input.clientEventId,
        invitationId,
        passVersion,
        reportedAt: new Date().toISOString(),
        reportedResult: result,
        reportedPeople: input.people,
        kind: input.kind,
        inputMethod: "qr",
      },
    };
    if (after.expiresAt <= Date.now()) return unavailable();
    const saved = await store.record(attempt, allowance);
    return { state: saved, clientEventId: input.clientEventId, result, people: input.people };
  }
  async function sync(session: string) {
    const snapshot = await current(session);
    if (!snapshot?.actor) return unavailable();
    const actor = snapshot.actor;
    const state = await store.read();
    const pending = state.attempts
      .filter((row) => policy.sameActor(row.actor, actor) && !row.rejected)
      .slice(0, 200);
    if (!pending.length) return { state: "idle" as const };
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const payload = await Promise.race([
        (async () => {
          const response = await options.fetcher(new URL("/api/checkin/sync", options.origin), {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expectedActor: actor, events: pending.map((row) => row.event) }),
          });
          if (response.status === 401 || response.status === 403) return { denied: true };
          if (!response.ok || !response.body) return null;
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let size = 0;
          try {
            for (;;) {
              const next = await reader.read();
              if (next.done) break;
              size += next.value.byteLength;
              if (size > 128 * 1024) {
                void reader.cancel();
                return null;
              }
              chunks.push(next.value);
            }
          } finally {
            reader.releaseLock();
          }
          const bytes = new Uint8Array(size);
          let offset = 0;
          for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
          }
          return object(
            JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown,
          );
        })(),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("Offline sync timed out"));
          }, 10_000);
        }),
      ]);
      if (payload && "denied" in payload) return { state: "denied" as const };
      if (
        !payload ||
        !Array.isArray(payload.acks) ||
        typeof payload.signedOut !== "boolean" ||
        payload.acks.length !== pending.length
      )
        return unavailable();
      const ids = new Set(pending.map((row) => row.event.clientEventId));
      if (
        !payload.acks.every((ack: unknown) => {
          const row = object(ack);
          return row && typeof row.clientEventId === "string" && ids.has(row.clientEventId);
        })
      )
        return unavailable();
      if (!(await store.acknowledge(actor, payload.acks, crypto.randomUUID())))
        return unavailable();
      const committed = payload.acks.filter((ack: unknown) => {
        const row = object(ack);
        return row?.status === "recorded" || row?.status === "duplicate";
      }).length;
      return { state: payload.signedOut ? ("denied" as const) : ("synced" as const), committed };
    } catch {
      return unavailable();
    } finally {
      clearTimeout(timer);
    }
  }
  return { status, record, sync };
}
