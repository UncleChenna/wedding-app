import { expect, it, vi } from "vitest";
import { submitLostLinkRequest } from "../server/lost-link-submission";

const input = { name: "Ada Okafor", contact: "ada@example.test" };
const allowed = async () => ({ status: "allowed" as const });

it("returns only a neutral acknowledgement after storing a validated request", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const result = await submitLostLinkRequest(input, { budget: allowed, save });
  expect(save).toHaveBeenCalledWith({ ...input, contactKind: "email" });
  expect(result).toEqual({
    status: "received",
    message:
      "Thank you. Your request is with us. If we can find your invitation, we’ll help you get your link again.",
  });
});

it("returns exactly the same response for different valid contacts, with no lookup dependency", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const dependencies = { budget: allowed, save };
  expect(await submitLostLinkRequest(input, dependencies)).toEqual(
    await submitLostLinkRequest({ ...input, contact: "unknown@example.test" }, dependencies),
  );
  expect(save).toHaveBeenCalledTimes(2);
});

it("applies the budget even to malformed submissions and never writes a denied request", async () => {
  const budget = vi.fn().mockResolvedValue({ status: "limited", retryAfterSeconds: 60 });
  const save = vi.fn();
  expect(await submitLostLinkRequest({}, { budget, save })).toEqual({
    status: "retry",
    message: "Please wait a minute before trying again.",
  });
  expect(budget).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
});

it("rejects invalid input without persisting it", async () => {
  const save = vi.fn();
  expect((await submitLostLinkRequest({}, { budget: allowed, save })).status).toBe("invalid");
  expect(save).not.toHaveBeenCalled();
});

it("does not return database error details or pretend a failed save succeeded", async () => {
  const save = vi.fn().mockRejectedValue(new Error("SQL includes private@example.test"));
  expect(await submitLostLinkRequest(input, { budget: allowed, save })).toEqual({
    status: "unavailable",
    message: "We couldn’t save your request just now. Please try again shortly.",
  });
});

it("fails closed when the budget service is unavailable or throws", async () => {
  const save = vi.fn();
  for (const budget of [
    async () => ({ status: "unavailable" as const }),
    async () => {
      throw new Error("secret");
    },
  ]) {
    expect((await submitLostLinkRequest(input, { budget, save })).status).toBe("unavailable");
  }
  expect(save).not.toHaveBeenCalled();
});
