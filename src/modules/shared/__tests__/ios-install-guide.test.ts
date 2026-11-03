import { describe, expect, it } from "vitest";
import { iosInstallMode } from "../lib/ios-install-guide";

const safari =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
const input = {
  userAgent: safari,
  maxTouchPoints: 5,
  standalone: false,
  displayModeStandalone: false,
};

describe("iOS installation guidance", () => {
  it("recognises Safari on iPhone", () => {
    expect(iosInstallMode(input)).toBe("safari");
  });
  it("recognises iPad desktop browsing without treating a Mac as an iPad", () => {
    const userAgent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
    expect(iosInstallMode({ ...input, userAgent })).toBe("safari");
    expect(iosInstallMode({ ...input, userAgent, maxTouchPoints: 0 })).toBeNull();
  });
  it.each(["standalone", "displayModeStandalone"] as const)(
    "hides in installed mode via %s",
    (signal) => {
      expect(iosInstallMode({ ...input, [signal]: true })).toBeNull();
    },
  );
  it("offers Safari-opening advice for a WhatsApp-marked browser even with Safari tokens", () => {
    expect(iosInstallMode({ ...input, userAgent: safari + " WhatsApp/2.26" })).toBe("open-safari");
  });
  it("does not mistake an unmarked iOS webview for Safari", () => {
    expect(
      iosInstallMode({
        ...input,
        userAgent: safari.replace("Version/18.6 ", "").replace(" Safari/604.1", ""),
      }),
    ).toBe("open-safari");
  });
  it.each(["CriOS/140.0", "FxiOS/140.0", "EdgiOS/140.0", "OPiOS/90.0"])(
    "guides alternate iOS browser %s to Safari",
    (browser) => {
      expect(iosInstallMode({ ...input, userAgent: safari + " " + browser })).toBe("open-safari");
    },
  );
  it.each([
    "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
    "",
  ])("does not show an iOS guide for %s", (userAgent) => {
    expect(iosInstallMode({ ...input, userAgent })).toBeNull();
  });
});
