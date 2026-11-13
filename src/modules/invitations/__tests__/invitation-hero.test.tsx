// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { InvitationHero } from "../components/invitation-hero";

it("identifies stock subjects honestly and reserves responsive image space", () => {
  render(<InvitationHero />);
  const photo = screen.getByRole("img", { name: /stock photograph/i });
  expect(photo).toHaveAttribute("sizes", "100vw");
  expect(photo).toHaveAttribute("data-nimg", "fill");
  expect(photo.getAttribute("style")).toContain("background-image");
  expect(screen.getByText(/Sample photograph/)).toBeVisible();
  expect(screen.getByRole("link", { name: "Lauren Mitchell / Unsplash" })).toHaveAttribute(
    "href",
    "https://unsplash.com/photos/a-bride-and-groom-holding-hands-and-smiling-glouLzM1PMg",
  );
});

it("uses supplied photo description and blur metadata without labelling it stock", () => {
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
