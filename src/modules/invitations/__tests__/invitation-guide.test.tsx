// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { InvitationGuide } from "../components/invitation-guide";
it("offers an actionable resend step without pretending to send a request", () => {
  render(<InvitationGuide settings={{ ...defaultEventSettings, coupleNames: ["Jane", "Alex"] }} />);
  expect(screen.getByRole("heading", { name: "Need your link?" })).toBeVisible();
  expect(screen.getByText(/Ask the person who invited you to send your link again/)).toBeVisible();
  expect(screen.getByRole("link", { name: "Request your invitation link" })).toHaveAttribute(
    "href",
    "/lost-link",
  );
  expect(screen.getByRole("link", { name: "Back to our day" })).toHaveAttribute("href", "/");
  expect(screen.queryByRole("button")).toBeNull();
});
