import { test as base, expect } from "@playwright/test";
import { watchGuestQuality } from "./support/guest-quality";

/** Positive guest journeys opt in by importing this test; expected fault tests remain separate. */
export const test = base.extend({
  context: async ({ context }, runTest, info) => {
    const quality = await watchGuestQuality(context);
    try {
      await runTest(context);
    } finally {
      await quality.flush();
      await info.attach("guest-quality.json", {
        body: JSON.stringify(quality.issues),
        contentType: "application/json",
      });
      expect(
        quality.issues,
        "Guest routes require zero console errors and zero layout shift",
      ).toEqual([]);
    }
  },
});
export { expect };
