// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { InvitationDesignForm } from "../components/invitation-design-form";
// Vitest imports image URLs; Next's production loader supplies this static metadata.
vi.mock("../../../../public/share/couple-placeholder.jpg", () => ({
  default: {
    src: "/share/couple-placeholder.jpg",
    width: 1200,
    height: 1800,
    blurDataURL: "data:image/webp;base64,UklGRg==",
  },
}));
vi.mock("../server/invitation-design-actions", () => ({ saveInvitationDesignAction: vi.fn() }));
const defaults = {
  version: 0,
  photoId: null,
  photoAlt: "",
  headline: "Our day",
  subline: "Join us",
};
afterEach(() => vi.unstubAllGlobals());
it("rejects unsupported files before network access without losing edited wording", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  render(<InvitationDesignForm defaults={defaults} photo={null} />);
  fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Our new headline" } });
  fireEvent.change(screen.getByLabelText("Upload a photo"), {
    target: { files: [new File(["bad"], "image.svg", { type: "image/svg+xml" })] },
  });
  expect(await screen.findByText("Choose a JPEG, PNG or WebP photo.")).toBeVisible();
  expect(fetcher).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Headline")).toHaveValue("Our new headline");
});
it("retains wording and fallback preview when a valid upload fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  render(<InvitationDesignForm defaults={defaults} photo={null} />);
  fireEvent.change(screen.getByLabelText("Invitation message"), {
    target: { value: "A message to keep" },
  });
  fireEvent.change(screen.getByLabelText("Upload a photo"), {
    target: { files: [new File(["test"], "photo.jpg", { type: "image/jpeg" })] },
  });
  await waitFor(() => expect(screen.getByText(/We couldn’t upload/)).toBeVisible());
  expect(screen.getByLabelText("Invitation message")).toHaveValue("A message to keep");
  expect(screen.getByText(/Sample photograph will be shown/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Save invitation design" })).toBeEnabled();
});
