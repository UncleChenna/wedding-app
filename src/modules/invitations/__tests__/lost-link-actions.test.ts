import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock("../server/lost-link-submission", () => ({ submitLostLinkRequest: mocks.submit }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: { insert: vi.fn() } }));
vi.mock("@/modules/shared/server/request-rate-limit", () => ({ actionRateLimit: vi.fn() }));
import { requestInvitationLink } from "../server/lost-link-actions";

beforeEach(() => vi.clearAllMocks());

it.each(["invalid", "retry", "unavailable"])(
  "returns bounded submitted defaults on %s",
  async (status) => {
    mocks.submit.mockResolvedValue({ status, message: "Try again." });
    const form = new FormData();
    form.set("name", "a".repeat(250));
    form.set("contact", "b".repeat(300));
    expect(await requestInvitationLink(null, form)).toEqual({
      status,
      message: "Try again.",
      fields: { name: "a".repeat(200), contact: "b".repeat(254) },
    });
  },
);

it("does not echo contact fields with the neutral successful receipt", async () => {
  mocks.submit.mockResolvedValue({ status: "received", message: "Your request is with us." });
  const form = new FormData();
  form.set("name", "Sample Guest");
  form.set("contact", "sample@example.test");
  expect(await requestInvitationLink(null, form)).toEqual({
    status: "received",
    message: "Your request is with us.",
  });
});

it("does not reflect uploaded blobs into text fields", async () => {
  mocks.submit.mockResolvedValue({ status: "invalid", message: "Check your details." });
  const form = new FormData();
  form.set("name", new Blob(["not a name"]));
  form.set("contact", new Blob(["not a contact"]));
  expect((await requestInvitationLink(null, form)).fields).toEqual({ name: "", contact: "" });
});
