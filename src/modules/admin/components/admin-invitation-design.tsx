import { db } from "@/modules/shared/server/db/client";
import { readInvitationDesign } from "@/modules/shared/server/invitation-design";
import { invitationSiteCopy } from "@/modules/invitations/lib/copy";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { InvitationDesignForm } from "./invitation-design-form";

export async function AdminInvitationDesign() {
  await requireAdminPageAccess();
  const saved = await readInvitationDesign(db);
  const photo =
    saved?.photoId && saved.width && saved.height && saved.blurDataURL
      ? {
          id: saved.photoId,
          width: saved.width,
          height: saved.height,
          blurDataURL: saved.blurDataURL,
        }
      : null;
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight">Your invitation design</h1>
      <p className="mt-6 max-w-prose">
        Choose a photograph and make the wording your own. Preview your changes before saving.
      </p>
      <InvitationDesignForm
        defaults={{
          version: saved?.version ?? 0,
          photoId: saved?.photoId ?? null,
          photoAlt: saved?.photoAlt ?? "",
          headline: saved?.headline ?? invitationSiteCopy.headline,
          subline: saved?.subline ?? invitationSiteCopy.subline,
        }}
        photo={photo}
      />
    </main>
  );
}
