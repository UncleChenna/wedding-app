import { describe, expect, it, vi } from "vitest";
import { sendWhatsAppTemplate, type WhatsAppConfig } from "../server/whatsapp";

const config: WhatsAppConfig = {
  accessToken: "synthetic-token",
  phoneNumberId: "123456",
  apiVersion: "v27.0",
  template: "station_order_alert",
  language: "en_GB",
};
const accepted = () => Response.json({ messages: [{ id: "wamid.synthetic" }] });
const rejected = (status = 500, code = 131000) => Response.json({ error: { code } }, { status });
const message = { number: "+2348031234567", text: "Table 12: 2 x rice." };

describe("WhatsApp template sender", () => {
  it("sends an approved template only to a currently opted-in recipient", async () => {
    const fetcher = vi.fn(async () => accepted());
    expect(
      await sendWhatsAppTemplate(config, message, { fetcher, eligible: async () => true }),
    ).toBe("accepted");
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v27.0/123456/messages");
    expect(init.headers).toMatchObject({ authorization: "Bearer synthetic-token" });
    expect(JSON.parse(String(init.body))).toMatchObject({
      messaging_product: "whatsapp",
      to: "2348031234567",
      type: "template",
      template: {
        name: "station_order_alert",
        language: { code: "en_GB" },
        components: [{ type: "body", parameters: [{ type: "text", text: message.text }] }],
      },
    });
  });
  it("retries an explicit transient rejection three times then fails", async () => {
    const fetcher = vi.fn(async () => rejected());
    const sleep = vi.fn(async () => {});
    expect(
      await sendWhatsAppTemplate(config, message, { fetcher, sleep, eligible: async () => true }),
    ).toBe("failed");
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls).toEqual([[500], [1000], [2000]]);
  });
  it("stops retrying when consent is withdrawn", async () => {
    const fetcher = vi.fn(async () => rejected());
    const eligible = vi.fn().mockResolvedValueOnce(true).mockResolvedValue(false);
    expect(
      await sendWhatsAppTemplate(config, message, { fetcher, eligible, sleep: async () => {} }),
    ).toBe("skipped");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not contact a recipient without recorded consent", async () => {
    const fetcher = vi.fn();
    expect(
      await sendWhatsAppTemplate(config, message, { fetcher, eligible: async () => false }),
    ).toBe("skipped");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["timeout", "network", "bare-500", "malformed-success"])(
    "does not retry ambiguous %s outcomes",
    async (kind) => {
      const fetcher = vi.fn(async () => {
        if (kind === "timeout" || kind === "network") throw new Error(kind);
        return kind === "bare-500"
          ? new Response("unavailable", { status: 500 })
          : Response.json({});
      });
      expect(
        await sendWhatsAppTemplate(config, message, { fetcher, eligible: async () => true }),
      ).toBe("uncertain");
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it("does not retry permanent authentication failure", async () => {
    const fetcher = vi.fn(async () => rejected(401, 190));
    expect(
      await sendWhatsAppTemplate(config, message, { fetcher, eligible: async () => true }),
    ).toBe("failed");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("stops at the overall deadline before consent or HTTP work", async () => {
    const eligible = vi.fn(async () => true),
      fetcher = vi.fn();
    expect(
      await sendWhatsAppTemplate(config, message, { eligible, fetcher, deadline: Date.now() - 1 }),
    ).toBe("failed");
    expect(eligible).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not truncate a long instruction or send an invalid phone number", async () => {
    const fetcher = vi.fn();
    for (const invalid of [
      { ...message, text: "x".repeat(1025) },
      { ...message, number: "not-a-phone" },
    ]) {
      expect(
        await sendWhatsAppTemplate(config, invalid, { fetcher, eligible: async () => true }),
      ).toBe("failed");
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
});
