import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/modules/shared/server/db/client";
import { invitationLifecycleEvents, invitations, rsvps } from "@/modules/shared/server/db/schema";
import { generateInvitationToken } from "@/modules/invitations/lib/token";
import {
  invitationLifecycleCommandSchema,
  planInvitationLifecycle,
  type LifecycleStatus,
} from "../lib/invitation-lifecycle";

export type LifecycleResult =
  | { ok: true; operation: "revoke" | "reissue"; status: LifecycleStatus; tokenVersion: number }
  | {
      ok: false;
      code:
        | "invalid_input"
        | "missing"
        | "conflict"
        | "already_revoked"
        | "version_exhausted"
        | "token_exhausted";
    };

function tokenCollision(error: unknown, depth = 0): boolean {
  if (depth > 3 || typeof error !== "object" || error === null) return false;
  if (
    "code" in error &&
    error.code === "23505" &&
    "constraint_name" in error &&
    error.constraint_name === "invitations_token_unique"
  )
    return true;
  return "cause" in error && tokenCollision(error.cause, depth + 1);
}

/** Internal primitive. The action must supply the live authenticated administrator's UUID. */
export async function changeInvitationLifecycle(
  database: Pick<Db, "transaction">,
  input: unknown,
  actorId: string,
): Promise<LifecycleResult> {
  const parsed = invitationLifecycleCommandSchema.safeParse(input);
  const actor = z.uuid().safeParse(actorId);
  if (!parsed.success || !actor.success) return { ok: false, code: "invalid_input" };
  const command = parsed.data;
  for (let attempt = 0; attempt < 5; attempt++) {
    const replacement = command.operation === "reissue" ? generateInvitationToken() : null;
    try {
      const result = await database.transaction(async (tx) => {
        // RSVP edits acquire this same row lock: old capabilities cannot write after rotation.
        const [current] = await tx
          .select({
            id: invitations.id,
            token: invitations.token,
            status: invitations.status,
            tokenVersion: invitations.tokenVersion,
          })
          .from(invitations)
          .where(eq(invitations.id, command.invitationId))
          .for("update");
        if (!current) return { ok: false, code: "missing" } as const;
        const [reply] = await tx
          .select({ attending: rsvps.attending })
          .from(rsvps)
          .where(eq(rsvps.invitationId, current.id));
        const plan = planInvitationLifecycle(
          { ...current, attending: reply?.attending ?? null },
          command,
        );
        if (!plan.ok) return plan;
        if (replacement === current.token) return { ok: false, code: "retry_token" } as const;
        await tx
          .update(invitations)
          .set({
            status: plan.status,
            tokenVersion: plan.tokenVersion,
            ...(replacement ? { token: replacement } : {}),
            updatedAt: new Date(),
          })
          .where(eq(invitations.id, current.id));
        // The state change must roll back if durable audit insertion fails.
        await tx.insert(invitationLifecycleEvents).values({
          invitationId: current.id,
          operation: command.operation,
          actorId: actor.data,
          beforeStatus: current.status,
          afterStatus: plan.status,
          beforeVersion: current.tokenVersion,
          afterVersion: plan.tokenVersion,
        });
        return {
          ok: true,
          operation: command.operation,
          status: plan.status,
          tokenVersion: plan.tokenVersion,
        } as const;
      });
      if (!result.ok && result.code === "retry_token") continue;
      return result;
    } catch (error) {
      if (command.operation === "reissue" && tokenCollision(error)) continue;
      throw error;
    }
  }
  return { ok: false, code: "token_exhausted" };
}
