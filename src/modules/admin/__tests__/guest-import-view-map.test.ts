import { expect, it } from "vitest";
import { toImportPreviewView } from "../lib/guest-import-view-map";
it("keeps row-specific errors unchanged", () => {
  const error = {
    status: "error" as const,
    message: "Correct the file",
    errors: [{ row: 7, column: "email", message: "Invalid email" }],
  };
  expect(toImportPreviewView(error)).toEqual(error);
});
it("maps the approved identity and household limits without creating a second parser", () => {
  const result = toImportPreviewView({
    status: "preview",
    preview: {
      id: "approved",
      digest: "digest",
      expiresAt: "2099-01-01T00:00:00Z",
      counts: { invitations: 1, guests: 2 },
      households: [
        {
          householdName: "Ada and Uchenna",
          side: "Family",
          tableNumber: 4,
          maxTagAlongs: 1,
          rows: [2, 3],
          members: [
            { name: "Ada", email: "ada@example.test", phone: null },
            { name: "Uchenna", email: null, phone: "+44123456789" },
          ],
        },
      ],
    },
  });
  expect(result).toEqual({
    status: "preview",
    id: "approved",
    digest: "digest",
    expiresAt: "2099-01-01T00:00:00Z",
    invitationCount: 1,
    guestCount: 2,
    households: [
      {
        key: "2:3",
        heading: "Ada and Uchenna",
        side: "Family",
        table: "Table 4",
        partyLimit: 3,
        members: ["Ada · ada@example.test", "Uchenna · +44123456789"],
      },
    ],
  });
});
