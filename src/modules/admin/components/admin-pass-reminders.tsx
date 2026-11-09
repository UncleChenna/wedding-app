import Link from "next/link";
import { RetryButton } from "@/modules/shared/components/retry-button";
import { getPassReminders } from "../server/pass-reminders";
import { ShareMenu } from "./share-menu";

export async function AdminPassReminders() {
  const result = await getPassReminders();
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-lg leading-relaxed wrap-anywhere">
      <Link
        href="/admin/sharing"
        className="mb-8 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to sharing
      </Link>
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Pass reminders</h1>
      <p className="mt-6 max-w-prose">
        Prepare a day-before message for the households joining us. Their invitation link holds
        their pass. Choose each household when you’re ready; nothing is sent automatically.
      </p>
      <p className="mt-6 max-w-prose text-muted-foreground">
        These messages say “tomorrow”, so share them the day before the wedding. Sharing records an
        attempt, not confirmed delivery.
      </p>
      {result.status === "error" ? (
        <div className="mt-12 space-y-6">
          <p role="alert">{result.message}</p>
          <RetryButton />
        </div>
      ) : result.invitations.length === 0 ? (
        <p className="mt-12">No attending households to remind yet.</p>
      ) : (
        <ul className="mt-12 space-y-12">
          {result.invitations.map((invitation) => (
            <li key={invitation.id} data-pass-reminder-id={invitation.id} className="space-y-6">
              <h2 className="font-display text-3xl">{invitation.name}</h2>
              {invitation.share ? (
                <>
                  <p className="max-w-prose">{invitation.share.message}</p>
                  <ShareMenu
                    key={invitation.tracking?.expectedVersion}
                    invitation={invitation.share}
                    tracking={invitation.tracking}
                  />
                </>
              ) : (
                <p>{invitation.guidance}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
