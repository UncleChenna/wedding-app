// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FadeIn, Rise } from "../components/ui/motion";

describe("motion wrappers", () => {
  it.each([FadeIn, Rise])("keeps content and controls available immediately", (Motion) => {
    const click = vi.fn();
    render(
      <Motion className="custom" aria-label="Invitation">
        <button onClick={click}>Reply</button>
      </Motion>,
    );
    expect(screen.getByLabelText("Invitation")).toHaveClass("custom");
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    expect(click).toHaveBeenCalledOnce();
  });

  it("uses the signature class only when requested", () => {
    render(
      <FadeIn pace="signature" data-testid="signature">
        Welcome
      </FadeIn>,
    );
    expect(screen.getByTestId("signature").className).toMatch(/signature/);
    expect(screen.getByTestId("signature")).not.toHaveAttribute("pace");
  });
});
