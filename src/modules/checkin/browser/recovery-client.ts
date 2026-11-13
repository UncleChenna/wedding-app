import { createOfflineQueuePolicy } from "../lib/offline-queue";
import { createOfflineQueueStore } from "./offline-queue-store";
import {
  recoveryExportSchema,
  recoveryReceiptSchema,
  recoveryRecordIdentity,
  type RecoveryExport,
} from "../lib/recovery";
import type { OfflineActor } from "../lib/offline-queue";

const serialized = <T>(operation: () => Promise<T>): Promise<T> => {
  if (!navigator.locks) return Promise.reject(new Error("Storage unavailable"));
  return navigator.locks.request("wedding-scanner-shell-publication-v1", operation);
};
export async function exportRecoveryEvidence(): Promise<{
  evidence: RecoveryExport;
  remaining: number;
}> {
  return serialized(async () => {
    const journal = await createOfflineQueueStore(createOfflineQueuePolicy()).read();
    const records = journal.attempts.slice(0, 200).map(({ actor, event }) => ({ actor, event }));
    return {
      evidence: recoveryExportSchema.parse({ version: 1, records }),
      remaining: Math.max(0, journal.attempts.length - records.length),
    };
  });
}
export async function applyRecoveryReceipt(token: string): Promise<number> {
  if (token.length > 256 * 1024) throw new Error("Receipt too large");
  const response = await fetch("/api/recovery/receipt", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receipt: token }),
  });
  if (!response.ok) throw new Error("Receipt not verified");
  const receipt = recoveryReceiptSchema.parse(await response.json());
  if (receipt.expiresAt <= Date.now()) throw new Error("Receipt expired");
  return serialized(async () => {
    const store = createOfflineQueueStore(createOfflineQueuePolicy());
    const journal = await store.read();
    const groups = new Map<string, { actor: OfflineActor; acks: unknown[] }>();
    let count = 0;
    for (const entry of receipt.entries) {
      const pending = journal.attempts.find(
        (row) => row.event.clientEventId === entry.ack.clientEventId,
      );
      if (!pending) continue;
      const digest = [
        ...new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(recoveryRecordIdentity(pending)),
          ),
        ),
      ]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      if (
        digest !== entry.digest ||
        pending.actor.staffId !== entry.actor.staffId ||
        pending.actor.deviceId !== entry.actor.deviceId
      )
        throw new Error("Receipt does not match retained evidence");
      const key = JSON.stringify(entry.actor),
        group = groups.get(key) ?? { actor: entry.actor, acks: [] };
      group.acks.push(entry.ack);
      groups.set(key, group);
      count++;
    }
    // Validate every identity before any journal write. Each actor transaction is
    // durable; interruption leaves the remaining actors available for safe retry.
    for (const group of groups.values()) {
      if (!(await store.acknowledge(group.actor, group.acks, crypto.randomUUID())))
        throw new Error("Acknowledgement could not be stored");
    }
    await store.purgeAcknowledged();
    return count;
  });
}
