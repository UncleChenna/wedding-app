"use server";

import { db } from "@/modules/shared/server/db/client";
import { invitationLinkRequests } from "@/modules/shared/server/db/schema";
import { actionRateLimit } from "@/modules/shared/server/request-rate-limit";
import { submitLostLinkRequest, type LostLinkSubmissionResult } from "./lost-link-submission";

export async function requestInvitationLink(
  _previous: LostLinkSubmissionResult | null,
  formData: FormData,
): Promise<LostLinkSubmissionResult> {
  return submitLostLinkRequest(
    { name: formData.get("name"), contact: formData.get("contact") },
    {
      budget: () => actionRateLimit("lost_link"),
      save: async (request) => {
        await db.insert(invitationLinkRequests).values(request);
      },
    },
  );
}
