// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/modules/theming/lib/contrast";
import { listThemes } from "@/modules/theming";

import { SCAN_STATUSES, StatusBadge, StatusPanel, statusAppearance } from "../components/ui";

describe("StatusPanel", () => {
  it.each(SCAN_STATUSES)("%s shows a text label and a named icon, not colour alone", (status) => {
    const { label } = statusAppearance(status);
    render(<StatusPanel status={status} identifier="Ada Lovelace" detail="Party of 2 · Table 7" />);
    const panel = screen.getByRole("region", { name: label });
    expect(panel).toHaveTextContent(label);
    expect(panel.querySelector("svg[role='img']")).toHaveAccessibleName(`${label} icon`);
    expect(panel).toHaveAttribute("data-status", status);
  });

  it("gives each status its own icon so meaning survives without colour", () => {
    const icons = SCAN_STATUSES.map((status) => statusAppearance(status).icon);
    expect(new Set(icons).size).toBe(SCAN_STATUSES.length);
  });

  it("renders the identifier at ≥32px and body text at ≥18px", () => {
    render(<StatusPanel status="valid" identifier="Ada Lovelace" detail="Party of 2 · Table 7" />);
    expect(screen.getByText("Ada Lovelace")).toHaveClass("text-4xl");
    expect(screen.getByText("Party of 2 · Table 7")).toHaveClass("text-lg");
    expect(screen.getByText("Valid")).toHaveClass("text-lg");
  });

  it("maps statuses to the fixed meanings: green valid, amber used/waiting, red problems", () => {
    expect(statusAppearance("valid").tone).toBe("success");
    expect(statusAppearance("used").tone).toBe("warning");
    expect(statusAppearance("not-rsvpd").tone).toBe("warning");
    expect(statusAppearance("invalid").tone).toBe("danger");
    expect(statusAppearance("revoked").tone).toBe("danger");
  });
});

describe("StatusBadge", () => {
  it("shows its label in text with an icon, at ≥18px", () => {
    render(<StatusBadge tone="warning">Preparing</StatusBadge>);
    const badge = screen.getByText("Preparing").closest("[data-tone]");
    expect(badge).toHaveAttribute("data-tone", "warning");
    expect(badge).toHaveClass("text-lg");
    expect(badge?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("status contrast in every theme", () => {
  it.each(listThemes().map((t) => [t.id, t] as const))(
    "%s: panel and badge text pairs pass WCAG AA",
    (_id, theme) => {
      for (const tone of ["success", "warning", "danger"] as const) {
        const panel = contrastRatio(
          theme.colors[`${tone}-subtle-foreground`],
          theme.colors[`${tone}-subtle`],
        );
        const badge = contrastRatio(theme.colors[`${tone}-foreground`], theme.colors[tone]);
        expect(panel, `${tone} panel`).toBeGreaterThanOrEqual(4.5);
        expect(badge, `${tone} badge`).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
