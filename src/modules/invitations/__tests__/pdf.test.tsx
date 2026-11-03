import { describe, expect, it } from "vitest";
import { renderInvitationPdf } from "../server/pdf";
import { listThemes } from "@/modules/theming/lib/registry";
import { defaultEventSettings, type EventSettings } from "@/modules/shared/lib/event-settings";

describe("printable invitation", () => {
  for (const theme of listThemes()) {
    it(`embeds ${theme.id} fonts and produces an A5 PDF without the editing credential`, async () => {
      const result = await renderInvitationPdf({
        details: { ...defaultEventSettings, coupleNames: ["Uchenna", "Adaora"] } as EventSettings,
        theme,
        pass: { names: ["Ada Nwosu"], householdName: null, partySize: 2, tableNumber: 8 },
        passUrl: "https://example.com/p/signed-read-only-pass",
      });
      expect(result.subarray(0, 5).toString()).toBe("%PDF-");
      const content = result.toString("latin1");
      expect(content).toContain(theme.id);
      expect(content).toContain(theme.fonts.display);
      expect(content).toContain(theme.fonts.body);
      for (const colour of [
        theme.colors.background,
        theme.colors.foreground,
        theme.colors.primary,
        theme.colors["qr-ink"],
        theme.colors["qr-paper"],
      ])
        expect(content).toContain(colour);
      expect(content).toContain("/FontFile2");
      expect(content).toMatch(/\/MediaBox \[0 0 419\.\d+ 595\.\d+\]/);
      expect(content).not.toContain("/i/");
    });
  }
});
