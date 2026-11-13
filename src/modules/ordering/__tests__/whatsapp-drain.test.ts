import { describe, expect, it, vi } from "vitest";
import {
  dispatchWhatsAppAlerts,
  type ClaimedWhatsAppBatch,
  type WhatsAppDrainStore,
} from "../server/whatsapp-drain";

const batch: ClaimedWhatsAppBatch = {
  station: "kitchen",
  ids: ["alert-a"],
  text: "Table 1: rice.",
  recipients: [
    { id: "lead-a", number: "+2348031234567" },
    { id: "lead-b", number: "+2348031234568" },
  ],
};
function fixture() {
  let claimed = false;
  const store: WhatsAppDrainStore = {
    claim: vi.fn(async () => {
      if (claimed) return [];
      claimed = true;
      return [batch];
    }),
    eligible: vi.fn(async () => true),
    accepted: vi.fn(async () => {}),
  };
  return store;
}

describe("durable WhatsApp dispatch", () => {
  it("does not resend accepted recipients after partial failure or repeated drain", async () => {
    const store = fixture();
    const send = vi.fn().mockResolvedValueOnce("accepted").mockResolvedValueOnce("uncertain");
    expect(await dispatchWhatsAppAlerts(store, send)).toEqual({ sent: 0, failed: 1 });
    expect(await dispatchWhatsAppAlerts(store, send)).toEqual({ sent: 0, failed: 0 });
    expect(send).toHaveBeenCalledTimes(2);
    expect(store.accepted).not.toHaveBeenCalled();
  });
  it("records acceptance only after all recipients accept", async () => {
    const store = fixture();
    const send = vi.fn(async (_message, eligible: () => Promise<boolean>) => {
      expect(await eligible()).toBe(true);
      return "accepted" as const;
    });
    expect(await dispatchWhatsAppAlerts(store, send)).toEqual({ sent: 1, failed: 0 });
    expect(store.accepted).toHaveBeenCalledWith(["alert-a"]);
    expect(store.eligible).toHaveBeenCalledTimes(2);
  });
  it("does not replay after the acceptance write fails", async () => {
    const store = fixture();
    store.accepted = vi.fn(async () => {
      throw new Error("database disconnected");
    });
    const send = vi.fn(async () => "accepted" as const);
    await expect(dispatchWhatsAppAlerts(store, send)).rejects.toThrow("database disconnected");
    await dispatchWhatsAppAlerts(store, send);
    expect(send).toHaveBeenCalledTimes(2);
  });
  it("keeps provider failures isolated from other recipients", async () => {
    const store = fixture();
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("disconnected"))
      .mockResolvedValueOnce("accepted");
    expect(await dispatchWhatsAppAlerts(store, send)).toEqual({ sent: 0, failed: 1 });
    expect(send).toHaveBeenCalledTimes(2);
  });
});
