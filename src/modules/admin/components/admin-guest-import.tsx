import Link from "next/link";
import { requireAdminPageAccess } from "../server/current-admin-access";
import {
  previewGuestImportUiAction,
  commitGuestImportUiAction,
} from "../server/guest-import-ui-actions";
import { GuestImportForm } from "./guest-import-form";

export async function AdminGuestImport() {
  await requireAdminPageAccess();
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
      <Link
        href="/admin/guests"
        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to guests
      </Link>
      <h1 className="mt-6 font-display text-4xl leading-tight md:text-5xl">Import guests</h1>
      <p className="mt-6 max-w-prose">
        Bring your guest list from a spreadsheet. We’ll check it with you before adding any
        invitations.
      </p>
      <GuestImportForm
        previewAction={previewGuestImportUiAction}
        commitAction={commitGuestImportUiAction}
      />
    </main>
  );
}
