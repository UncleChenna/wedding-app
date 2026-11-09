import type { ImportPreviewResult } from "./guest-import";
import type { ImportPreviewViewResult } from "./guest-import-view";

/** Presentation only: the approved service owns validation and commit identity. */
export function toImportPreviewView(result: ImportPreviewResult): ImportPreviewViewResult {
  if (result.status === "error") return result;
  const { preview } = result;
  return {
    status: "preview",
    id: preview.id,
    digest: preview.digest,
    expiresAt: preview.expiresAt,
    invitationCount: preview.counts.invitations,
    guestCount: preview.counts.guests,
    households: preview.households.map((household) => ({
      key: household.rows.join(":"),
      heading: household.householdName,
      members: household.members.map((member) =>
        [member.name, member.email, member.phone].filter(Boolean).join(" · "),
      ),
      partyLimit: household.members.length + household.maxTagAlongs,
      side: household.side,
      table: household.tableNumber === null ? null : `Table ${household.tableNumber}`,
    })),
  };
}
