import Link from "next/link";
import { RetryButton } from "@/modules/shared/components/retry-button";
import { getReminders } from "../server/reminders";
import { ShareMenu } from "./share-menu";

export async function AdminReminders() {
  const result = await getReminders();
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-lg leading-relaxed wrap-anywhere">
      <Link
        href="/admin/sharing"
        className="mb-8 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to sharing
      </Link>
      <h1 className="font-display text-4xl leading-tight md:text-5xl">A gentle reminder</h1>
      <p className="mt-6 max-w-prose">
        These households have been sent an invitation and haven&apos;t replied yet. Choose whom to
        nudge; nothing is sent automatically.
      </p>
      <p className="mt-6 text-muted-foreground">
        Last shared means a recorded attempt, not confirmed delivery. Times are shown in UTC.
      </p>
      {result.status === "error" ? (
        <div className="mt-12 space-y-6">
          <p role="alert">{result.message}</p>
          <RetryButton />
        </div>
      ) : result.invitations.length === 0 ? (
        <p className="mt-12">No sent invitations are waiting for a reply.</p>
      ) : (
        <ul className="mt-12 space-y-12">
          {result.invitations.map((invitation) => (
            <li key={invitation.id} data-reminder-id={invitation.id} className="space-y-6">
              <h2 className="font-display text-3xl">{invitation.name}</h2>
              <p>
                Last shared:{" "}
                {invitation.lastSharedAt ? (
                  <time dateTime={invitation.lastSharedAt}>
                    {invitation.lastSharedAt.replace("T", " ").replace(/\.\d+Z$/, " UTC")}
                  </time>
                ) : (
                  "Not recorded"
                )}
              </p>
              {invitation.share ? (
                <ShareMenu
                  key={invitation.tokenVersion}
                  invitation={invitation.share}
                  tracking={invitation.tracking}
                  purpose="reminder"
                />
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
