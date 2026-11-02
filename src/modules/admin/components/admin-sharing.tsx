import Link from "next/link";
import { appRoutes } from "@/modules/shared/lib/routes";
import { getSharingInvitations } from "../server/sharing-invitations";
import { ShareMenu } from "./share-menu";

export async function AdminSharing() {
  const invitations = await getSharingInvitations();
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Sharing</h1>
      <p className="mt-6 max-w-prose">
        Choose an invitation to share. Each link belongs to its invited household; send it only to
        them.
      </p>
      {invitations.length === 0 ? (
        <p className="mt-12">
          No invitations yet. Add your guests before sharing their invitations.
        </p>
      ) : (
        <ul className="mt-12 space-y-12">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="space-y-6">
              <h2 className="font-display text-3xl wrap-anywhere">{invitation.name}</h2>
              {invitation.share ? (
                <ShareMenu invitation={invitation.share} />
              ) : (
                <p>{invitation.guidance}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link
        href={appRoutes.admin.path}
        className="mt-12 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to control room
      </Link>
    </main>
  );
}
