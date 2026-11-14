// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { expect, it } from "vitest";
import { CenteredPanel } from "../components/ui/centered-panel";

it("renders one centred main with eyebrow, title, description, content and footer", () => {
  render(
    <CenteredPanel
      eyebrow="Wedding admin"
      title="Welcome back"
      description="Use your invited email."
      footer={<Link href="/">Back to our day</Link>}
    >
      <button type="button">Send code</button>
    </CenteredPanel>,
  );
  const main = screen.getByRole("main");
  expect(main.className).toMatch(/items-center/);
  expect(main.className).toMatch(/justify-center/);
  expect(screen.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
  expect(screen.getByText("Wedding admin")).toBeVisible();
  expect(screen.getByText("Use your invited email.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Send code" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Back to our day" })).toBeVisible();
});

it("uses the ornamented divider for guests and a plain hairline for staff", () => {
  const { rerender, container } = render(<CenteredPanel title="Hello" />);
  expect(container.querySelector('[data-variant="guest"]')).not.toBeNull();
  rerender(<CenteredPanel title="Hello" variant="staff" />);
  expect(container.querySelector('[data-variant="staff"]')).not.toBeNull();
});
