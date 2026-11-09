import Link from "next/link";
import { asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { tables } from "@/modules/shared/server/db/schema";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { readInvitationEditor } from "../server/invitation-editor";
import { InvitationEditorForm } from "./invitation-editor-form";

export async function AdminInvitationEditor({ id }: { id?: string }) {
  await requireAdminPageAccess();
  const invitation = id ? await readInvitationEditor(db, id) : undefined;
  if (id && !invitation) notFound();
  const tableOptions = await db
    .select({ id: tables.id, number: tables.number })
    .from(tables)
    .orderBy(asc(tables.number));
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-lg leading-relaxed">
      <Link
        href="/admin/guests"
        className="mb-8 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to guests
      </Link>
      <h1 className="font-display text-4xl md:text-5xl">
        {invitation ? "Edit invitation" : "Add an invitation"}
      </h1>
      <p className="mt-6 max-w-prose">
        {invitation
          ? "Update the household and its named guests. Their invitation link stays the same."
          : "Start with a draft for one household. You can review it before sending the invitation."}
      </p>
      <InvitationEditorForm invitation={invitation ?? undefined} tables={tableOptions} />
    </main>
  );
}
