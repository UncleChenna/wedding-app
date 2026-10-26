// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Divider, Monogram, Paper } from "../components/ui";

describe("Divider", () => {
  it("is a semantic separator with a decorative, hidden ornament", () => {
    const { container } = render(<Divider />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(container.querySelector("[data-ornament]")).toHaveAttribute("aria-hidden", "true");
  });

  it("drops the ornament and lightens weight on staff screens", () => {
    const { container } = render(<Divider variant="staff" />);
    expect(container.querySelector("[data-ornament]")).toBeNull();
    expect(screen.getByRole("separator")).toHaveAttribute("data-variant", "staff");
  });
});

describe("Monogram", () => {
  it("is announced once with a readable name", () => {
    render(<Monogram initials={["A", "G"]} />);
    expect(screen.getByRole("img", { name: "A & G monogram" })).toHaveTextContent("A&G");
  });

  it("can be purely decorative", () => {
    const { container } = render(<Monogram initials={["A", "G"]} decorative />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the theme's display role for the couple's names", () => {
    render(<Monogram initials={["A", "G"]} />);
    expect(screen.getByRole("img").querySelector("[data-initials]")).toHaveClass("font-display");
  });
});

describe("Paper", () => {
  it("wraps content with a hidden, non-interactive texture layer", () => {
    const { container } = render(
      <Paper>
        <p>Kindly reply</p>
      </Paper>,
    );
    expect(screen.getByText("Kindly reply")).toBeInTheDocument();
    const layer = container.querySelector("[data-paper-texture]");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).toHaveClass("paper-texture");
  });
});

describe("decorations use theme tokens only", () => {
  it("has no literal colours in the component source", () => {
    const source = readFileSync(
      join(process.cwd(), "src/modules/shared/components/ui/decorations.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(/);
  });
});
