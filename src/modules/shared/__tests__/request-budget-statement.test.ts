import { describe, expect, it, vi } from "vitest";
import { consumeRequestBudget } from "../server/request-budget";
import type { Db } from "../server/db/client";

vi.mock("server-only", () => ({}));

const budget = {
  identity: "a".repeat(64),
  scope: "ordering" as const,
  limit: 240,
  windowSeconds: 60,
};

/**
 * TICKET-258: the decision is one statement, never a transaction held across app round trips.
 * A held transaction made every request queue on the shared row and exhausted the pool.
 */
function fakeDatabase(results: unknown[][]) {
  const execute = vi.fn(async () => results.shift() ?? []);
  const transaction = vi.fn(async () => {
    throw new Error("request budgets must not open a transaction");
  });
  return {
    database: { execute, transaction } as unknown as Pick<Db, "transaction" | "execute">,
    execute,
    transaction,
  };
}

describe("consumeRequestBudget", () => {
  it("allows with one deciding statement and no transaction", async () => {
    const { database, execute, transaction } = fakeDatabase([[], [{ allowed: 1 }]]);
    expect(await consumeRequestBudget(database, budget)).toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    expect(transaction).not.toHaveBeenCalled();
    // Expired-row cleanup, then the single upsert that decides.
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("refuses when the upsert returns nothing and reports when to retry", async () => {
    const { database, transaction } = fakeDatabase([[], [], [{ seconds: "42" }]]);
    expect(await consumeRequestBudget(database, budget)).toEqual({
      allowed: false,
      retryAfterSeconds: 42,
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("never asks a caller to retry sooner than a second", async () => {
    const { database } = fakeDatabase([[], [], [{ seconds: "0" }]]);
    expect((await consumeRequestBudget(database, budget)).retryAfterSeconds).toBe(1);
  });
});
