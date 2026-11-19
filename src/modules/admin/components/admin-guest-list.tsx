import { Suspense } from "react";
import { AddInvitationModal } from "./add-invitation-modal";
import { AdminInvitationEditor } from "./admin-invitation-editor";
import Link from "next/link";
import { appRoutes } from "@/modules/shared/lib/routes";
import { RetryButton } from "@/modules/shared/components/retry-button";
import { getGuestList } from "../server/guest-list";
import { DraftDeletedNotice } from "./draft-deleted-notice";
import { GuestList } from "./guest-list";

export async function AdminGuestList({ draftDeleted = false }: { draftDeleted?: boolean } = {}) {
  const result = await getGuestList();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 text-base leading-relaxed sm:px-6 md:py-10">
      {draftDeleted && <DraftDeletedNotice />}
      <header className="flex items-center justify-between gap-4 border-b border-border pb-6 sm:items-end">
        <div>
          <p className="mb-2 hidden text-sm tracking-widest text-muted-foreground uppercase sm:block">
            Your celebration
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">Guests</h1>
          <p className="mt-3 hidden max-w-prose text-muted-foreground sm:block">
            Everyone you’re celebrating with, in one place.
          </p>
        </div>
        <AddInvitationModal>
          <Suspense fallback={<p role="status">Loading guest form…</p>}>
            <AdminInvitationEditor embedded />
          </Suspense>
        </AddInvitationModal>
      </header>
      <nav aria-label="Guest tools" className="flex flex-wrap gap-x-6 gap-y-1 py-4 text-sm">
        <Link
          href={appRoutes.adminGuestImport.path}
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Import guests
        </Link>
        <Link
          href={appRoutes.adminGatePrint.path}
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Print gate list
        </Link>
      </nav>
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
