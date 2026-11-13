import { expect, it } from "vitest";
import { invitationDesignInput } from "@/modules/shared/lib/invitation-design";
import { validateEditorFile } from "../lib/invitation-design";

const valid = {
  version: 0,
  photoId: null,
  photoAlt: "",
  headline: "Together, always.",
  subline: "Join our celebration.",
};
it("requires meaningful bounded wording and a description for a selected photo", () => {
  expect(invitationDesignInput.safeParse(valid).success).toBe(true);
  expect(invitationDesignInput.safeParse({ ...valid, headline: "  " }).success).toBe(false);
  expect(invitationDesignInput.safeParse({ ...valid, subline: "x".repeat(1001) }).success).toBe(
    false,
  );
  expect(
    invitationDesignInput.safeParse({ ...valid, photoId: "b3d7ac2d-e0dc-4632-82d7-08b9b06210c3" })
      .success,
  ).toBe(false);
  expect(
    invitationDesignInput.safeParse({ ...valid, photoId: "https://untrusted.example/photo" })
      .success,
  ).toBe(false);
  expect(invitationDesignInput.safeParse({ ...valid, version: -1 }).success).toBe(false);
});
it("rejects oversized and unsupported files before uploading", () => {
  expect(validateEditorFile({ size: 8 * 1024 * 1024 + 1, type: "image/jpeg" })).toMatch(/8 MB/);
  expect(validateEditorFile({ size: 100, type: "image/svg+xml" })).toMatch(/JPEG/);
  expect(validateEditorFile({ size: 0, type: "image/png" })).toBeTruthy();
  expect(validateEditorFile({ size: 8 * 1024 * 1024, type: "image/webp" })).toBeNull();
});
