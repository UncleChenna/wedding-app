import { expect, it, vi } from "vitest";
import type { Db } from "@/modules/shared/server/db/client";
import { findStoredPass } from "../server/pass-repository";

it("selects only pass identity/allowance columns and reconstructs the result without private fields", async () => {
  const secret = "private allergy marker";
  const chain = { leftJoin: vi.fn(), where: vi.fn(), orderBy: vi.fn() };
  chain.leftJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockResolvedValue([
    {
      status: "rsvp_yes",
      tokenVersion: 1,
      householdName: "Family",
      tableNumber: 4,
      attending: true,
      countAttending: 1,
      name: "Ada",
      dietaryNotes: secret,
      notes: secret,
      history: [{ dietary_notes: secret }],
    },
  ]);
  const select = vi.fn().mockReturnValue({ from: () => chain });
  const database = { select } as unknown as Pick<Db, "select">;
  const result = await findStoredPass(database, "00000000-0000-4000-8000-000000000001");
  expect(Object.keys(select.mock.calls[0]?.[0] ?? {}).sort()).toEqual([
    "attending",
    "countAttending",
    "householdName",
    "name",
    "status",
    "tableNumber",
    "tokenVersion",
  ]);
  expect(result).toEqual({
    status: "rsvp_yes",
    tokenVersion: 1,
    householdName: "Family",
    tableNumber: 4,
    attending: true,
    countAttending: 1,
    primaryNames: ["Ada"],
  });
  expect(JSON.stringify(result)).not.toContain(secret);
});
