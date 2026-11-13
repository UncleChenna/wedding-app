import { expect, it } from "vitest";
import {
  recoveryExportSchema,
  recoveryImportSchema,
  recoveryRecordIdentity,
} from "../lib/recovery";
const record = {
  actor: { staffId: "11111111-1111-4111-8111-111111111111", deviceId: "a".repeat(64) },
  event: {
    clientEventId: "22222222-2222-4222-8222-222222222222",
    invitationId: null,
    passVersion: 1,
    reportedAt: "2026-12-19T12:00:00Z",
    reportedResult: "valid" as const,
    reportedPeople: 1,
    kind: "admission" as const,
    inputMethod: "qr" as const,
  },
};
it("accepts minimal evidence but rejects session material, duplicates and oversized exports", () => {
  expect(recoveryExportSchema.safeParse({ version: 1, records: [record] }).success).toBe(true);
  expect(
    recoveryExportSchema.safeParse({ version: 1, records: [{ ...record, session: "secret" }] })
      .success,
  ).toBe(false);
  expect(recoveryExportSchema.safeParse({ version: 1, records: [record, record] }).success).toBe(
    false,
  );
  expect(
    recoveryExportSchema.safeParse({ version: 1, records: Array(201).fill(record) }).success,
  ).toBe(false);
});
it("requires explicit review and preserves every intent field in receipt identity", () => {
  expect(
    recoveryImportSchema.safeParse({
      requestId: crypto.randomUUID(),
      reviewed: false,
      evidence: { version: 1, records: [record] },
    }).success,
  ).toBe(false);
  expect(recoveryRecordIdentity(record)).not.toBe(
    recoveryRecordIdentity({ ...record, event: { ...record.event, reportedPeople: 2 } }),
  );
  expect(recoveryRecordIdentity(record)).toBe(
    recoveryRecordIdentity({
      ...record,
      event: { ...record.event, reportedAt: "2026-12-19T13:00:00+01:00" },
    }),
  );
});
it("normalizes legacy omitted kinds while distinguishing observations from admissions", () => {
  const legacy = { ...record, event: { ...record.event, kind: undefined, inputMethod: undefined } };
  expect(recoveryRecordIdentity(legacy)).toBe(recoveryRecordIdentity(record));
  const observation = { ...legacy, event: { ...legacy.event, reportedPeople: 0 } };
  expect(recoveryRecordIdentity(observation)).toBe(
    recoveryRecordIdentity({
      ...record,
      event: { ...record.event, reportedPeople: 0, kind: "observation" },
    }),
  );
  expect(recoveryRecordIdentity(observation)).not.toBe(recoveryRecordIdentity(legacy));
  const named = {
    ...record,
    event: { ...record.event, invitationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
  };
  expect(recoveryRecordIdentity(named)).toBe(
    recoveryRecordIdentity({
      ...named,
      event: { ...named.event, invitationId: named.event.invitationId.toUpperCase() },
    }),
  );
  expect(recoveryRecordIdentity(named)).not.toBe(recoveryRecordIdentity(record));
});
