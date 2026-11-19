import Link from "next/link";
import { asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { tables } from "@/modules/shared/server/db/schema";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { readInvitationEditor } from "../server/invitation-editor";
import { InvitationEditorForm } from "./invitation-editor-form";

export async function AdminInvitationEditor({
  id,
  embedded = false,
}: {
  id?: string;
  embedded?: boolean;
}) {
  await requireAdminPageAccess();
  const invitation = id ? await readInvitationEditor(db, id) : undefined;
  if (id && !invitation) notFound();
  const tableOptions = await db
    .select({ id: tables.id, number: tables.number })
    .from(tables)
    .orderBy(asc(tables.number));
  if (embedded)
    return (
      <InvitationEditorForm invitation={invitation ?? undefined} tables={tableOptions} embedded />
    );
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 text-base leading-relaxed sm:px-6 md:py-10">
      <Link
        href="/admin/guests"
        className="mb-4 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to guests
      </Link>
      <h1 className="font-display text-4xl md:text-5xl">
        {invitation ? "Edit invitation" : "Add an invitation"}
      </h1>
      <p className="mt-3 max-w-prose text-muted-foreground">
        {invitation
          ? "Update the guest and their invited party. Their invitation link stays the same."
          : "Add your guest, include a plus-one if needed, then preview and send their invitation."}
      </p>
      <InvitationEditorForm invitation={invitation ?? undefined} tables={tableOptions} />
    </main>
  );
}
