import { describe, expect, it, vi } from "vitest";
import { saveValidatedThemeDraft } from "../server/theme-drafts";
import { themes } from "../themes";
import lowContrast from "./fixtures/low-contrast.json" with { type: "json" };

const theme = themes[0];
if (!theme) throw new Error("Missing theme fixture");
const draft = { ...theme, id: "custom-celebration", name: "Our celebration", pattern: undefined };

describe("validated theme drafts", () => {
  it("denies access before inspecting input or persisting", async () => {
    const save = vi.fn();
    const input = new Proxy(
      {},
      {
        get: () => {
          throw new Error("Input was inspected");
        },
      },
    );
    expect(await saveValidatedThemeDraft(input, { authorize: async () => false, save })).toEqual({
      status: "denied",
      message: "Please complete two-step admin sign-in first.",
    });
    expect(save).not.toHaveBeenCalled();
  });
  it("persists only canonical validated tokens after authorization", async () => {
    const order: string[] = [];
    const save = vi.fn(async () => {
      order.push("save");
    });
    const result = await saveValidatedThemeDraft(draft, {
      authorize: async () => {
        order.push("authorize");
        return true;
      },
      save,
    });
    expect(result).toEqual({ status: "saved", id: draft.id });
    expect(order).toEqual(["authorize", "save"]);
    expect(save).toHaveBeenCalledExactlyOnceWith(draft);
  });
  it.each([
    [lowContrast, "foreground on background"],
    [{ ...draft, fonts: { ...draft.fonts, display: "unregistered-font" } }, "fonts.display"],
    [{ ...draft, colors: { ...draft.colors, primary: "invalid" } }, "colors.primary"],
  ])("returns named validation failures without persistence", async (input, namedFailure) => {
    const save = vi.fn();
    const result = await saveValidatedThemeDraft(input, { authorize: async () => true, save });
    expect(result.status).toBe("invalid");
    expect("message" in result && result.message).toContain(namedFailure);
    expect(save).not.toHaveBeenCalled();
  });
  it("hides persistence errors and never reports an unsuccessful save as saved", async () => {
    const result = await saveValidatedThemeDraft(draft, {
      authorize: async () => true,
      save: async () => {
        throw new Error("private connection detail");
      },
    });
    expect(result).toEqual({
      status: "unavailable",
      message: "We couldn’t save the theme just now. Please try again.",
    });
  });
  it("fails closed if authorization is unavailable", async () => {
    const save = vi.fn();
    const result = await saveValidatedThemeDraft(draft, {
      authorize: async () => {
        throw new Error("private auth detail");
      },
      save,
    });
    expect(result.status).toBe("unavailable");
    expect(save).not.toHaveBeenCalled();
  });
});
