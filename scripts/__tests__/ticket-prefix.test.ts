import { describe, expect, it } from "vitest";
import { branchHasTicket, formatId, idNumber, ledgerKey } from "../tickets/model";

describe("ticket prefix", () => {
  it("formats the requested canonical prefix and preserves numeric ordering", () => {
    expect(formatId(7)).toBe("TICKET-007");
    expect(idNumber("TICKET-186")).toBe(186);
  });
  it("retains one ledger key for old and new callers", () => {
    expect(ledgerKey("TICKET-186")).toBe("WED-186");
    expect(ledgerKey("WED-186")).toBe("WED-186");
  });
  it("accepts active legacy branches but not another ticket number", () => {
    expect(branchHasTicket("alice/WED-014-task", "TICKET-014")).toBe(true);
    expect(branchHasTicket("alice/TICKET-014-task", "TICKET-014")).toBe(true);
    expect(branchHasTicket("alice/TICKET-0140-task", "TICKET-014")).toBe(false);
    expect(branchHasTicket("alice/WED-015-task", "TICKET-014")).toBe(false);
  });
});
