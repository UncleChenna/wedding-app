// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkerUpdatePrompt } from "../components/worker-update-prompt";
afterEach(cleanup);
describe("update notification", () => {
  it("offers an explicit reload and Later when ready", () => {
    const reload = vi.fn(),
      later = vi.fn();
    render(
      <WorkerUpdatePrompt
        value={{ state: "ready", pending: 0 }}
        onReload={reload}
        onLater={later}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(reload).toHaveBeenCalledOnce();
    expect(later).toHaveBeenCalledOnce();
  });
  it.each(["deferred", "unavailable", "checking", "updating"] as const)(
    "does not permit reload in %s state",
    (state) => {
      const reload = vi.fn();
      render(
        <WorkerUpdatePrompt
          value={state === "deferred" ? { state, pending: 2 } : { state }}
          onReload={reload}
          onLater={vi.fn()}
        />,
      );
      const button = screen.getByRole("button", {
        name: state === "updating" ? "Updating…" : "Reload",
      });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(reload).not.toHaveBeenCalled();
      expect(screen.getByRole("status")).not.toBeEmptyDOMElement();
    },
  );
  it("does not render anything without an update", () => {
    const { container } = render(
      <WorkerUpdatePrompt value={{ state: "hidden" }} onReload={vi.fn()} onLater={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
