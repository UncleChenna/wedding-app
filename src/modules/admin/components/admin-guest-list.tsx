import Link from "next/link";
import { appRoutes } from "@/modules/shared/lib/routes";
import { RetryButton } from "@/modules/shared/components/retry-button";
import { getGuestList } from "../server/guest-list";
import { DraftDeletedNotice } from "./draft-deleted-notice";
import { GuestList } from "./guest-list";

export async function AdminGuestList({ draftDeleted = false }: { draftDeleted?: boolean } = {}) {
  const result = await getGuestList();
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 text-lg leading-relaxed">
      {draftDeleted && <DraftDeletedNotice />}
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Guests</h1>
      <p className="mt-6 max-w-prose">
        Find your guests, check their replies and manage each invitation.
      </p>
      <div className="mt-6 flex flex-wrap gap-6">
        <Link
          href={appRoutes.adminGuestNew.path}
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Add an invitation
        </Link>
        <Link
          href={appRoutes.adminGatePrint.path}
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Print gate list
        </Link>
        <Link
          href={appRoutes.adminSeating.path}
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Seating plan
        </Link>
      </div>
      {result.ok ? (
        <GuestList invitations={result.invitations} />
      ) : (
        <div className="mt-12 space-y-6">
          <p role="alert">{result.message}</p>
          <RetryButton />
        </div>
      )}
    </main>
  );
}
