// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { GatePrintTable } from "../components/gate-print-table";
import { buildGatePrintRows } from "@/modules/checkin/lib/gate-print";
it("renders all companion names and explicit partial admission totals", () => {
  const rows = buildGatePrintRows([
    {
      id: "one",
      status: "rsvp_yes",
      householdName: "Okafor",
      countAttending: 2,
      tableNumber: 3,
      admittedPeople: 1,
      guests: [
        { name: "Ada Okafor", isPrimary: true },
        { name: "Obi Okafor", isPrimary: false },
      ],
    },
  ]);
  render(<GatePrintTable rows={rows} />);
  expect(screen.getByRole("table")).toHaveAccessibleName(
    "Confirmed invitations and admission totals",
  );
  expect(screen.getByText("Ada Okafor")).toBeVisible();
  expect(screen.getByText("Obi Okafor")).toBeVisible();
  expect(screen.getByText("1 so far")).toBeVisible();
  expect(screen.getByText("1 remaining")).toBeVisible();
  expect(screen.getAllByRole("columnheader")).toHaveLength(4);
});
