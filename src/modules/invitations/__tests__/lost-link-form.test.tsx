// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type * as React from "react";
const state = vi.hoisted(() => ({
  result: null as null | { status: string; message: string },
  pending: false,
}));
vi.mock("react", async (original) => ({
  ...(await original<typeof React>()),
  useActionState: () => [state.result, "/synthetic-action", state.pending],
}));
vi.mock("../server/lost-link-actions", () => ({ requestInvitationLink: vi.fn() }));
import { LostLinkForm } from "../components/lost-link-form";

afterEach(() => {
  cleanup();
  state.result = null;
  state.pending = false;
});
it("offers labelled required fields and a usable invitation return link", () => {
  render(<LostLinkForm />);
  expect(screen.getByRole("textbox", { name: "Your full name" })).toBeRequired();
  expect(screen.getByRole("textbox", { name: "Phone number or email" })).toBeRequired();
  expect(screen.getByRole("link", { name: "Back to invitations" })).toHaveAttribute(
    "href",
    "/invite",
  );
});
it("disables duplicate submission while displaying progress", () => {
  state.pending = true;
  render(<LostLinkForm />);
  expect(screen.getByRole("button", { name: "Saving your request…" })).toBeDisabled();
});
it.each(["invalid", "retry", "unavailable"])("announces %s and leaves a retry form", (status) => {
  state.result = { status, message: "Please try again shortly." };
  render(<LostLinkForm />);
  expect(screen.getByRole("status")).toHaveTextContent(state.result.message);
  expect(screen.getByRole("button", { name: "Request my link" })).toBeEnabled();
});
it("announces receipt without leaving an accidental resubmission button", () => {
  state.result = { status: "received", message: "Your request is with us." };
  render(<LostLinkForm />);
  expect(screen.getByRole("status")).toHaveTextContent(state.result.message);
  expect(screen.queryByRole("button", { name: "Request my link" })).toBeNull();
  expect(screen.getByRole("link", { name: "Back to invitations" })).toBeVisible();
});
