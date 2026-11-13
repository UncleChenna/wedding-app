// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { InvitationHero } from "../components/invitation-hero";

it("shows the default photo plainly, with reserved responsive space and no sample labels", () => {
  const { container } = render(<InvitationHero />);
  const photo = screen.getByRole("img", { name: "A couple holding hands in warm evening light" });
  expect(photo).toHaveAttribute("sizes", "100vw");
  expect(photo).toHaveAttribute("data-nimg", "fill");
  expect(photo.getAttribute("style")).toContain("background-image");
  expect(container.textContent).toBe("");
  expect(screen.queryByRole("link")).toBeNull();
  expect(container.innerHTML).not.toMatch(/sample|stock|unsplash/i);
});

it("uses supplied photo description and blur metadata", () => {
  render(
    <InvitationHero
      photo={{
        src: "/approved-photo.webp",
        alt: "Uchenna and Adaora in a garden",
        blurDataURL: "data:image/webp;base64,UklGRg==",
      }}
    />,
  );
  expect(screen.getByRole("img", { name: "Uchenna and Adaora in a garden" })).toBeVisible();
  expect(screen.queryByText(/Sample photograph/)).toBeNull();
});
