import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { readAdminCard } from "@/modules/invitations/card";
import { PrintedInvitationCard } from "@/modules/invitations/components/printed-invitation-card";

export async function AdminCardPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPageAccess();
  const { id } = await params;
  const card = await readAdminCard(id);
  if (!card) notFound();
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="type-heading">Invitation card preview</h1>
      <p className="my-6 text-lg leading-relaxed">
        This is {card.guestName}’s card. Previewing does not send or publish it.
      </p>
      {card.status === "draft" && (
        <p className="mb-6 text-lg leading-relaxed">
          Draft: the guest link will work after you publish this invitation.
        </p>
      )}
      <nav aria-label="Card preview actions" className="mb-8 flex flex-wrap gap-6">
        <a
          href={`/admin/invitations/${encodeURIComponent(id)}/card.pdf`}
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          Download personalised card
        </a>
        <Link
          href="/admin/sharing"
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          Back to sharing
        </Link>
      </nav>
      <PrintedInvitationCard card={card} replyHref={card.rsvpUrl} />
    </main>
  );
}
