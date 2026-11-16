// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { createOrderFeedback } from "../browser/order-feedback";

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});
it("shows literal text, bounds notifications and keeps failures until dismissal", () => {
  vi.useFakeTimers();
  const feedback = createOrderFeedback(document.body);
  feedback.notify("Order sent");
  feedback.notify("<script>not markup</script>", true);
  expect(document.querySelectorAll(".order-feedback-card")).toHaveLength(1);
  expect(document.querySelector("script")).toBeNull();
  vi.advanceTimersByTime(60000);
  expect(document.querySelector('[role="alert"]')?.textContent).toContain("<script>");
  document.querySelector<HTMLButtonElement>("button")?.click();
  expect(document.querySelector(".order-feedback-card")).toBeNull();
  feedback.notify("Order sent");
  vi.advanceTimersByTime(6000);
  expect(document.querySelector(".order-feedback-card")).toBeNull();
  feedback.dispose();
  expect(document.querySelector(".order-feedback")).toBeNull();
});
