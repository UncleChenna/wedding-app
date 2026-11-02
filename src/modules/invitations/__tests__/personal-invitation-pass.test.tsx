// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { PersonalInvitation } from "../components/personal-invitation";
vi.mock("../server/rsvp-actions", () => ({ respondToInvitation: vi.fn() }));
it.each(["yes", "no", null] as const)(
  "only displays supplied pass for attendance %s",
  (attendance) => {
    render(
      <PersonalInvitation
        invitation={{ householdName: "Family", primaryNames: ["Ada"], attendance }}
        token={"a".repeat(43)}
        repliesOpen
        details={defaultEventSettings}
        pass={<p>Real signed pass</p>}
      />,
    );
    expect(screen.queryByText("Real signed pass") !== null).toBe(attendance === "yes");
    expect(screen.queryByRole("link", { name: "Your pass" }) !== null).toBe(attendance === "yes");
    expect(screen.getByRole("button", { name: "Count me in" })).toBeVisible();
    expect(screen.getByRole("button", { name: "I'll be there in spirit" })).toBeVisible();
  },
);

it.each(["yes", "no", null] as const)(
  "only shows the unavailable-pass notice for accepted attendance %s",
  (attendance) => {
    render(
      <PersonalInvitation
        invitation={{ householdName: "Family", primaryNames: ["Ada"], attendance }}
        token={"a".repeat(43)}
        repliesOpen
        details={defaultEventSettings}
        passNotice={<p>Pass temporarily unavailable</p>}
      />,
    );
    expect(screen.queryByText("Pass temporarily unavailable") !== null).toBe(attendance === "yes");
    expect(screen.queryByRole("link", { name: "Your pass" })).toBeNull();
    expect(screen.queryByText(/Your pass will be available here/)).toBeNull();
  },
);
