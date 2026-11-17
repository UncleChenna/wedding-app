"use client";
import { useEffect, useState } from "react";
import { Button, Sheet } from "@/modules/shared/components/ui";
import { loadSavedInvitationSharing } from "../server/saved-invitation-sharing";
import { PrintedInvitationCard } from "@/modules/invitations/components/printed-invitation-card";
import { ShareMenu } from "./share-menu";

export function SavedInvitationSharing({ id }: { id: string }) {
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof loadSavedInvitationSharing>
  > | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    let active = true;
    loadSavedInvitationSharing(id)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active)
          setResult({
            ok: false,
            message: "Your invitation is saved. Please retry to preview or send it.",
          });
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  if (!result) return <p role="status">Preparing your invitation…</p>;
  if (!result.ok)
    return (
      <div className="space-y-4">
        <p role="alert">{result.message}</p>
        <Button
          type="button"
          onClick={() => {
            setResult(null);
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  const { share, tracking, guidance } = result.invitation;
  if (!share) return <p role="status">{guidance}</p>;
  return (
    <section aria-label="Preview and send invitation" className="space-y-4">
      <p>Preview the invitation, then send it to your guest by WhatsApp, email or a copied link.</p>
      <div className="flex flex-wrap items-start gap-4">
        <Button type="button" variant="secondary" onClick={() => setPreview(true)}>
          Preview invitation
        </Button>
        <ShareMenu invitation={share} tracking={tracking} triggerLabel="Send invitation" />
      </div>
      <Sheet
        open={preview}
        onOpenChange={setPreview}
        title="Preview invitation"
        className="w-full max-w-3xl"
      >
        <p className="mb-4">
          This is your guest’s invitation. Opening this preview does not send it.
        </p>
        <div className="max-h-[65dvh] overflow-y-auto">
          {preview &&
            (result.card ? (
              <PrintedInvitationCard card={result.card} replyHref={share.url} />
            ) : (
              <p role="status">
                The personalised card is not available on this local database yet.
              </p>
            ))}
        </div>
      </Sheet>
    </section>
  );
}
