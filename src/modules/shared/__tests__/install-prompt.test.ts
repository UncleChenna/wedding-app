import { describe, expect, it, vi } from "vitest";
import {
  createInstallPromptController,
  INSTALL_DISMISSED_KEY,
  DISMISSAL_MS,
} from "../lib/install-prompt";

function setup(stored: string | null = null) {
  const host = new EventTarget();
  const storage = { getItem: vi.fn(() => stored), setItem: vi.fn() };
  const now = 100_000;
  const controller = createInstallPromptController(host, storage, () => now);
  return { host, storage, controller, now };
}
function offer(host: EventTarget, outcome: "accepted" | "dismissed" = "accepted") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn(async () => undefined);
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
  host.dispatchEvent(event);
  return { event, prompt };
}

describe("installation prompt", () => {
  it("requires both browser eligibility and a visitor interaction", () => {
    const { host, controller } = setup();
    expect(controller.getSnapshot()).toBe("hidden");
    const { event } = offer(host);
    expect(event.defaultPrevented).toBe(true);
    expect(controller.getSnapshot()).toBe("hidden");
    host.dispatchEvent(new Event("pointerup"));
    expect(controller.getSnapshot()).toBe("available");
    controller.dispose();
  });
  it("does not offer installation merely because someone uses a keyboard", () => {
    const { host, controller } = setup();
    host.dispatchEvent(new Event("keyup"));
    expect(controller.getSnapshot()).toBe("hidden");
    offer(host);
    expect(controller.getSnapshot()).toBe("available");
    controller.dispose();
  });
  it("remembers dismissal for exactly 30 days", () => {
    const { host, storage, controller, now } = setup();
    offer(host);
    host.dispatchEvent(new Event("keyup"));
    controller.dismiss();
    expect(storage.setItem).toHaveBeenCalledWith(INSTALL_DISMISSED_KEY, String(now + DISMISSAL_MS));
    expect(controller.getSnapshot()).toBe("hidden");
    for (const [expiry, expected] of [
      [now + 1, "hidden"],
      [now, "available"],
    ] as const) {
      const next = setup(String(expiry));
      offer(next.host);
      next.host.dispatchEvent(new Event("keyup"));
      expect(next.controller.getSnapshot()).toBe(expected);
      next.controller.dispose();
    }
    controller.dispose();
  });
  it("consumes the browser event once and remembers native dismissal", async () => {
    const { host, storage, controller } = setup();
    const { prompt } = offer(host, "dismissed");
    host.dispatchEvent(new Event("keyup"));
    await Promise.all([controller.install(), controller.install()]);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toBe("hidden");
    controller.dispose();
  });
  it("hides when installed elsewhere and removes event listeners on cleanup", () => {
    const { host, controller } = setup();
    const listener = vi.fn();
    controller.subscribe(listener);
    offer(host);
    host.dispatchEvent(new Event("keyup"));
    host.dispatchEvent(new Event("appinstalled"));
    expect(controller.getSnapshot()).toBe("hidden");
    controller.dispose();
    listener.mockClear();
    offer(host);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("installation failures", () => {
  it("keeps a session dismissal when storage is unavailable", () => {
    const host = new EventTarget();
    const controller = createInstallPromptController(host, {
      getItem() {
        throw new Error("Storage unavailable");
      },
      setItem() {
        throw new Error("Storage unavailable");
      },
    });
    offer(host);
    host.dispatchEvent(new Event("keyup"));
    expect(controller.getSnapshot()).toBe("available");
    expect(() => controller.dismiss()).not.toThrow();
    offer(host);
    expect(controller.getSnapshot()).toBe("hidden");
    controller.dispose();
  });
  it("handles a rejected native prompt without surfacing a technical error", async () => {
    const { host, controller } = setup();
    const { prompt } = offer(host);
    prompt.mockRejectedValueOnce(new Error("Expired event"));
    host.dispatchEvent(new Event("keyup"));
    await expect(controller.install()).resolves.toBeUndefined();
    expect(controller.getSnapshot()).toBe("hidden");
    controller.dispose();
  });
  it("ignores malformed stored expiry and malformed browser events", () => {
    const { host, controller } = setup("not-a-number");
    host.dispatchEvent(new Event("beforeinstallprompt"));
    host.dispatchEvent(new Event("keyup"));
    expect(controller.getSnapshot()).toBe("hidden");
    offer(host);
    expect(controller.getSnapshot()).toBe("available");
    controller.dispose();
  });
});
