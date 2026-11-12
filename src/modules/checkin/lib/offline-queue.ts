export type OfflineAllowance =
  { kind: "known"; remaining: number } | { kind: "name-checked-unknown" };
export type OfflineActor = { staffId: string; deviceId: string };
export type OfflineVerdict = "valid" | "already_used" | "invalid" | "revoked" | "not_rsvped";
export type OfflineEvent = {
  clientEventId: string;
  invitationId: string | null;
  passVersion: number;
  reportedAt: string;
  reportedResult: OfflineVerdict;
  reportedPeople: number;
  kind: "observation" | "admission";
  inputMethod: "qr" | "manual";
};
export type OfflineAttempt = {
  actor: OfflineActor;
  session: string;
  rejected: boolean;
  event: OfflineEvent;
};
export type OfflineReceipt = {
  attempt: OfflineAttempt;
  result: OfflineVerdict;
  admitted: number;
  conflict: boolean;
};
export type OfflineQueueState = {
  version: 1;
  attempts: OfflineAttempt[];
  receipts: OfflineReceipt[];
  barriers: { actor: OfflineActor; generation: string }[];
};

/** Self-contained policy embedded verbatim in the worker. No names, tokens or credentials. */
export function createOfflineQueuePolicy() {
  const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
  const HEX = /^[a-f0-9]{64}$/;
  const results = ["valid", "already_used", "invalid", "revoked", "not_rsvped"];
  const maxRecords = 10_000;
  const object = (value: unknown): Record<string, unknown> | null =>
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  const exact = (value: Record<string, unknown>, fields: string[]) =>
    Object.keys(value).length === fields.length &&
    Object.keys(value).every((key) => fields.includes(key));
  const uuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);
  const count = (value: unknown, maximum = 50): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= maximum;
  const verdict = (value: unknown): value is OfflineVerdict =>
    typeof value === "string" && results.includes(value);
  function actor(value: unknown): value is OfflineActor {
    const row = object(value);
    return Boolean(
      row &&
      exact(row, ["staffId", "deviceId"]) &&
      uuid(row.staffId) &&
      typeof row.deviceId === "string" &&
      HEX.test(row.deviceId),
    );
  }
  const sameActor = (a: OfflineActor, b: OfflineActor) =>
    a.staffId === b.staffId && a.deviceId === b.deviceId;
  function attempt(value: unknown): value is OfflineAttempt {
    const row = object(value);
    if (
      !row ||
      !exact(row, ["actor", "session", "rejected", "event"]) ||
      !actor(row.actor) ||
      typeof row.session !== "string" ||
      !HEX.test(row.session) ||
      typeof row.rejected !== "boolean"
    )
      return false;
    const event = object(row.event);
    if (
      !event ||
      !exact(event, [
        "clientEventId",
        "invitationId",
        "passVersion",
        "reportedAt",
        "reportedResult",
        "reportedPeople",
        "kind",
        "inputMethod",
      ]) ||
      !uuid(event.clientEventId) ||
      !(event.invitationId === null || uuid(event.invitationId)) ||
      !count(event.passVersion, 1_000_000) ||
      event.passVersion < 1 ||
      typeof event.reportedAt !== "string" ||
      event.reportedAt.length > 40 ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(event.reportedAt) ||
      !Number.isFinite(Date.parse(event.reportedAt)) ||
      new Date(event.reportedAt).toISOString() !== event.reportedAt ||
      !verdict(event.reportedResult) ||
      !count(event.reportedPeople) ||
      (event.inputMethod !== "qr" && event.inputMethod !== "manual")
    )
      return false;
    return event.kind === "observation"
      ? event.reportedPeople === 0
      : event.kind === "admission" &&
          (event.reportedPeople === 0 || event.invitationId !== null) &&
          (event.reportedResult === "valid") === event.reportedPeople > 0;
  }
  function receipt(value: unknown): value is OfflineReceipt {
    const row = object(value);
    return Boolean(
      row &&
      exact(row, ["attempt", "result", "admitted", "conflict"]) &&
      attempt(row.attempt) &&
      verdict(row.result) &&
      count(row.admitted) &&
      row.admitted <= row.attempt.event.reportedPeople &&
      typeof row.conflict === "boolean" &&
      (row.admitted === 0 || row.result === "valid") &&
      (row.admitted === row.attempt.event.reportedPeople || row.conflict),
    );
  }
  const empty = (): OfflineQueueState => ({ version: 1, attempts: [], receipts: [], barriers: [] });
  function parse(value: unknown): OfflineQueueState | null {
    const row = object(value);
    if (
      !row ||
      !exact(row, ["version", "attempts", "receipts", "barriers"]) ||
      row.version !== 1 ||
      !Array.isArray(row.attempts) ||
      !Array.isArray(row.receipts) ||
      !Array.isArray(row.barriers) ||
      row.attempts.length + row.receipts.length > maxRecords ||
      row.barriers.length > maxRecords ||
      !row.attempts.every(attempt) ||
      !row.receipts.every(receipt)
    )
      return null;
    const ids = [
      ...row.attempts.map((item) => item.event.clientEventId),
      ...row.receipts.map((item) => item.attempt.event.clientEventId),
    ];
    if (new Set(ids).size !== ids.length) return null;
    const actors = new Set<string>();
    for (const item of row.barriers) {
      const barrier = object(item);
      if (
        !barrier ||
        !exact(barrier, ["actor", "generation"]) ||
        !actor(barrier.actor) ||
        !uuid(barrier.generation)
      )
        return null;
      const key = `${barrier.actor.staffId}/${barrier.actor.deviceId}`;
      if (actors.has(key)) return null;
      actors.add(key);
    }
    // Every field has been validated; cloning prevents callers aliasing durable input.
    return structuredClone(row) as OfflineQueueState;
  }
  function pendingPeople(state: OfflineQueueState, invitationId: string): number {
    return state.attempts
      .filter((row) => row.event.invitationId === invitationId && row.event.kind === "admission")
      .reduce((sum, row) => sum + row.event.reportedPeople, 0);
  }
  const sameAttempt = (a: OfflineAttempt, b: OfflineAttempt) =>
    sameActor(a.actor, b.actor) &&
    a.session === b.session &&
    Object.entries(a.event).every(([key, value]) => b.event[key as keyof OfflineEvent] === value);
  function record(
    state: OfflineQueueState,
    input: OfflineAttempt,
    allowance: OfflineAllowance,
  ): "recorded" | "duplicate" | "rejected" | "too_many" | "full" | "refresh_required" {
    if (
      !attempt(input) ||
      input.rejected ||
      (input.event.reportedPeople > 0 && input.event.invitationId === null)
    )
      return "rejected";
    const bounded = object(allowance);
    if (
      !bounded ||
      !(bounded.kind === "known"
        ? exact(bounded, ["kind", "remaining"]) && count(bounded.remaining, 2_147_483_647)
        : bounded.kind === "name-checked-unknown" && exact(bounded, ["kind"]))
    )
      return "rejected";
    const remaining = allowance.kind === "known" ? allowance.remaining : null;
    const existing =
      state.attempts.find((row) => row.event.clientEventId === input.event.clientEventId) ??
      state.receipts.find((row) => row.attempt.event.clientEventId === input.event.clientEventId)
        ?.attempt;
    if (existing) return sameAttempt(existing, input) ? "duplicate" : "rejected";
    if (input.event.reportedPeople > 0 && state.barriers.length > 0) return "refresh_required";
    if (state.attempts.length + state.receipts.length >= maxRecords) return "full";
    if (
      remaining !== null &&
      input.event.reportedPeople > 0 &&
      input.event.invitationId &&
      input.event.reportedPeople + pendingPeople(state, input.event.invitationId) > remaining
    )
      return "too_many";
    state.attempts.push(structuredClone(input));
    return "recorded";
  }
  function acknowledge(
    state: OfflineQueueState,
    owner: OfflineActor,
    inputs: readonly unknown[],
    generation: string,
  ): boolean {
    if (!actor(owner) || !uuid(generation) || inputs.length < 1 || inputs.length > 200)
      return false;
    const ids = new Set<string>();
    const accepted: { row: OfflineAttempt; status: string; receipt?: OfflineReceipt }[] = [];
    for (const input of inputs) {
      const ack = object(input);
      if (!ack || !uuid(ack.clientEventId) || ids.has(ack.clientEventId)) return false;
      ids.add(ack.clientEventId);
      const row = state.attempts.find((item) => item.event.clientEventId === ack.clientEventId);
      if (!row || !sameActor(row.actor, owner)) return false;
      if (ack.status === "retry" || ack.status === "rejected") {
        if (!exact(ack, ["clientEventId", "status"])) return false;
        accepted.push({ row, status: ack.status });
      } else if (ack.status === "recorded" || ack.status === "duplicate") {
        if (!exact(ack, ["clientEventId", "status", "result", "admitted", "conflict"]))
          return false;
        const value = {
          attempt: row,
          result: ack.result,
          admitted: ack.admitted,
          conflict: ack.conflict,
        };
        if (!receipt(value)) return false;
        accepted.push({ row, status: ack.status, receipt: value });
      } else return false;
    }
    let committed = false;
    for (const item of accepted) {
      if (item.status === "rejected") item.row.rejected = true;
      if (item.receipt) {
        state.attempts = state.attempts.filter((row) => row !== item.row);
        state.receipts.push(item.receipt);
        committed = true;
      }
    }
    if (committed) {
      state.barriers = state.barriers.filter((row) => !sameActor(row.actor, owner));
      state.barriers.push({ actor: structuredClone(owner), generation });
    }
    return true;
  }
  const barrier = (state: OfflineQueueState, owner: OfflineActor) =>
    state.barriers.find((row) => sameActor(row.actor, owner))?.generation ?? null;
  function clearBarrier(
    state: OfflineQueueState,
    owner: OfflineActor,
    generation: string,
  ): boolean {
    if (barrier(state, owner) !== generation) return false;
    state.barriers = state.barriers.filter((row) => !sameActor(row.actor, owner));
    return true;
  }
  function clearCapturedBarriers(
    state: OfflineQueueState,
    captured: OfflineQueueState["barriers"],
  ): number {
    let removed = 0;
    for (const value of captured) if (clearBarrier(state, value.actor, value.generation)) removed++;
    return removed;
  }
  return {
    empty,
    parse,
    record,
    pendingPeople,
    acknowledge,
    barrier,
    clearBarrier,
    clearCapturedBarriers,
    sameActor,
  };
}
