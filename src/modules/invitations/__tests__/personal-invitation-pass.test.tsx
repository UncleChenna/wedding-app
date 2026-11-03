// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("../server/party-actions", () => ({ updateParty: vi.fn() }));
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

it("keeps the accepted pass while hiding locked reply and party controls", () => {
  render(
    <PersonalInvitation
      invitation={{ householdName: "Family", primaryNames: ["Ada"], attendance: "yes" }}
      token={"a".repeat(43)}
      repliesOpen={false}
      replyClosedMessage="The big day is here, so your RSVP is locked. See you inside."
      details={defaultEventSettings}
      pass={<p>Real signed pass</p>}
      party={{ maxTagAlongs: 1, meals: [], people: [] }}
    />,
  );
  expect(screen.getByText("Real signed pass")).toBeVisible();
  expect(
    screen.getByText("The big day is here, so your RSVP is locked. See you inside."),
  ).toBeVisible();
  expect(screen.getByRole("heading", { name: "Your reply" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Your reply" })).toHaveAttribute("href", "#reply");
  expect(screen.queryByRole("button", { name: "Count me in" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Save guest/ })).toBeNull();
});

it.each(["no", null] as const)(
  "keeps closed attendance %s free of editing controls or a pass",
  (attendance) => {
    render(
      <PersonalInvitation
        invitation={{ householdName: "Family", primaryNames: ["Ada"], attendance }}
        token={"a".repeat(43)}
        repliesOpen={false}
        replyClosedMessage="The big day is here, so your RSVP is locked. See you inside."
        details={defaultEventSettings}
        pass={<p>Real signed pass</p>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Your reply" })).toBeVisible();
    expect(screen.queryByText("Real signed pass")).toBeNull();
    expect(screen.queryByRole("button", { name: "Count me in" })).toBeNull();
  },
);
