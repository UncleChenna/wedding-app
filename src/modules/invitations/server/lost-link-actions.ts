"use server";

import { db } from "@/modules/shared/server/db/client";
import { invitationLinkRequests } from "@/modules/shared/server/db/schema";
import { actionRateLimit } from "@/modules/shared/server/request-rate-limit";
import { submitLostLinkRequest, type LostLinkSubmissionResult } from "./lost-link-submission";

export type LostLinkFormResult = LostLinkSubmissionResult & {
  fields?: { name: string; contact: string };
};

export async function requestInvitationLink(
  _previous: LostLinkFormResult | null,
  formData: FormData,
): Promise<LostLinkFormResult> {
  const name = formData.get("name");
  const contact = formData.get("contact");
  const result = await submitLostLinkRequest(
    { name, contact },
    {
      budget: () => actionRateLimit("lost_link"),
      save: async (request) => {
        await db.insert(invitationLinkRequests).values(request);
      },
    },
  );
  if (result.status === "received") return result;
  // React resets successful action submissions even when they return validation errors.
  // Supply bounded defaults for this same guest's retry; never return matched guest data.
  return {
    ...result,
    fields: {
      name: typeof name === "string" ? name.slice(0, 200) : "",
      contact: typeof contact === "string" ? contact.slice(0, 254) : "",
    },
  };
}
