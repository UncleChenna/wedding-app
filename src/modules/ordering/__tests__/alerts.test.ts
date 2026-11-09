import { describe, expect, it } from "vitest";
import {
  ALERT_BATCH_WINDOW_MS,
  ALERT_DRAIN_INTERVAL_MS,
  ALERT_MAX_ATTEMPTS,
  dueBatches,
  formatOrderAlert,
} from "../lib/alerts";
import { drainAlerts, dryRunSender, memoryAlertOutbox } from "../server/alert-drain";

const at = (seconds: number) => new Date(Date.UTC(2026, 11, 19, 18, 0, seconds));

describe("formatOrderAlert", () => {
  it("matches the PRD example", () => {
    expect(
      formatOrderAlert(
        {
          table: 12,
          items: [
            { quantity: 2, name: "chicken" },
            { quantity: 1, name: "water" },
          ],
          note: "no pepper",
        },
        "kitchen",
      ),
    ).toBe("Table 12: 2 x chicken, 1 x water. Note: no pepper.");
  });
  it("omits an empty note and keeps a note's own full stop", () => {
    expect(
      formatOrderAlert({ table: 3, items: [{ quantity: 1, name: "rice" }], note: " " }, "kitchen"),
    ).toBe("Table 3: 1 x rice.");
    expect(
      formatOrderAlert(
        { table: 3, items: [{ quantity: 1, name: "rice" }], note: "Extra hot!" },
        "kitchen",
      ),
    ).toBe("Table 3: 1 x rice. Note: Extra hot!");
  });
  it.each(["bar", "kitchen"] as const)(
    "%s alert excludes private nested RSVP records but retains the submitted instruction",
    (station) => {
      const secret = "RSVP private allergy";
      const record = {
        table: 3,
        items: [{ quantity: 1, name: "water", dietaryNotes: secret, guest: { notes: secret } }],
        note: "No ice",
        dietaryNotes: secret,
        guests: [{ dietary_notes: secret }],
      };
      expect(formatOrderAlert(record, station)).toBe("Table 3: 1 x water. Note: No ice.");
    },
  );
});

describe("batching", () => {
  it("never makes an alert wait longer than 60 seconds", () => {
    expect(ALERT_BATCH_WINDOW_MS + ALERT_DRAIN_INTERVAL_MS).toBeLessThanOrEqual(60_000);
  });

  it("holds a station's first alert for the window, then sends everything pending at once", () => {
    const pending = [
      { id: "a", station: "kitchen" as const, createdAt: at(0), text: "Table 1: 1 x rice." },
      { id: "b", station: "kitchen" as const, createdAt: at(30), text: "Table 2: 1 x stew." },
    ];
    expect(dueBatches(pending, at(49))).toEqual([]);
    expect(dueBatches(pending, at(50))).toEqual([
      { station: "kitchen", ids: ["a", "b"], text: "Table 1: 1 x rice.\nTable 2: 1 x stew." },
    ]);
  });

  it("turns three orders within the window into one message per station (fake clock)", async () => {
    const outbox = memoryAlertOutbox();
    const send = dryRunSender();
    // Three orders at 0s, 20s and 40s, each with food and a drink.
    for (const [index, seconds] of [0, 20, 40].entries()) {
      outbox.enqueue({
        id: "k" + index,
        station: "kitchen",
        createdAt: at(seconds),
        text: `Table ${index + 1}: 1 x rice.`,
      });
      outbox.enqueue({
        id: "b" + index,
        station: "bar",
        createdAt: at(seconds),
        text: `Table ${index + 1}: 1 x water.`,
      });
    }
    // The scheduled drain ticks every 10 seconds with no new requests arriving.
    for (let seconds = 0; seconds <= 120; seconds += ALERT_DRAIN_INTERVAL_MS / 1000)
      await drainAlerts(outbox, send, at(seconds));
    expect(send.sent).toEqual([
      { station: "kitchen", text: "Table 1: 1 x rice.\nTable 2: 1 x rice.\nTable 3: 1 x rice." },
      { station: "bar", text: "Table 1: 1 x water.\nTable 2: 1 x water.\nTable 3: 1 x water." },
    ]);
    expect(outbox.rows.every((row) => row.status === "sent")).toBe(true);
  });

  it("sends a quiet station's single order on its own", async () => {
    const outbox = memoryAlertOutbox();
    const send = dryRunSender();
    outbox.enqueue({ id: "a", station: "bar", createdAt: at(0), text: "Table 5: 2 x water." });
    await drainAlerts(outbox, send, at(60));
    outbox.enqueue({ id: "b", station: "bar", createdAt: at(200), text: "Table 6: 1 x wine." });
    await drainAlerts(outbox, send, at(260));
    expect(send.sent.map((message) => message.text)).toEqual([
      "Table 5: 2 x water.",
      "Table 6: 1 x wine.",
    ]);
  });
});

describe("failures", () => {
  it("retries a failed send on the next tick without losing the alert", async () => {
    const outbox = memoryAlertOutbox();
    outbox.enqueue({ id: "a", station: "kitchen", createdAt: at(0), text: "Table 1: 1 x rice." });
    let calls = 0;
    const flaky = async () => {
      calls++;
      if (calls === 1) throw new Error("provider down");
    };
    expect(await drainAlerts(outbox, flaky, at(50))).toEqual({ sent: 0, failed: 1, waiting: 0 });
    expect(outbox.rows[0]?.status).toBe("pending");
    expect(await drainAlerts(outbox, flaky, at(60))).toEqual({ sent: 1, failed: 0, waiting: 0 });
    expect(outbox.rows[0]?.status).toBe("sent");
  });

  it("gives up after the maximum attempts instead of retrying forever", async () => {
    const outbox = memoryAlertOutbox();
    outbox.enqueue({ id: "a", station: "kitchen", createdAt: at(0), text: "Table 1: 1 x rice." });
    const down = async () => {
      throw new Error("provider down");
    };
    for (let tick = 0; tick < ALERT_MAX_ATTEMPTS + 2; tick++)
      await drainAlerts(outbox, down, at(50 + tick * 10));
    expect(outbox.rows[0]).toMatchObject({ status: "failed", attempts: ALERT_MAX_ATTEMPTS });
  });

  it("isolates one station's failure from the other's", async () => {
    const outbox = memoryAlertOutbox();
    outbox.enqueue({ id: "k", station: "kitchen", createdAt: at(0), text: "Table 1: 1 x rice." });
    outbox.enqueue({ id: "b", station: "bar", createdAt: at(0), text: "Table 1: 1 x water." });
    const sent: string[] = [];
    const kitchenDown = async (message: { station: string; text: string }) => {
      if (message.station === "kitchen") throw new Error("down");
      sent.push(message.text);
    };
    expect(await drainAlerts(outbox, kitchenDown, at(50))).toEqual({
      sent: 1,
      failed: 1,
      waiting: 0,
    });
    expect(sent).toEqual(["Table 1: 1 x water."]);
  });

  it("releases alerts that are not yet due so a later drain can claim them", async () => {
    const outbox = memoryAlertOutbox();
    outbox.enqueue({ id: "a", station: "bar", createdAt: at(0), text: "Table 1: 1 x water." });
    expect(await drainAlerts(outbox, dryRunSender(), at(10))).toEqual({
      sent: 0,
      failed: 0,
      waiting: 1,
    });
    expect(outbox.rows[0]?.status).toBe("pending");
  });
});
