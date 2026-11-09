import Link from "next/link";
import { getLinkRequests } from "../server/link-requests";
import { ShareMenu } from "./share-menu";

export async function LinkRequests({ page }: { page?: string }) {
  const queue = await getLinkRequests(page);
  return (
    <section className="mx-auto max-w-3xl px-6 py-10 text-lg leading-relaxed">
      <h1 className="font-display text-4xl">Invitation requests</h1>
      <p className="mt-6 text-lg leading-relaxed">
        Check each request before sharing. A matching name and contact is a suggestion, not proof of
        identity. Nothing is sent automatically.
      </p>
      {queue.requests.length === 0 && <p className="mt-8 text-lg">No requests on this page.</p>}
      <ul className="mt-8 space-y-10">
        {queue.requests.map((request) => (
          <li key={request.id} className="space-y-4 border-b border-border pb-8">
            <h2 className="font-display text-3xl break-words">{request.name}</h2>
            <p className="text-lg break-all">{request.contact}</p>
            <p className="text-lg text-muted-foreground">
              Received {request.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
            </p>
            {request.invitation ? (
              <>
                <p className="text-lg">Matching invitation: {request.invitation.name}</p>
                {request.invitation.share ? (
                  <ShareMenu
                    invitation={request.invitation.share}
                    tracking={{
                      invitationId: request.invitation.id,
                      expectedVersion: request.invitation.tokenVersion,
                    }}
                  />
                ) : (
                  <p className="text-lg">{request.invitation.guidance}</p>
                )}
              </>
            ) : (
              <p className="text-lg">
                No unique match. Check with the couple before sharing an invitation.
              </p>
            )}
          </li>
        ))}
      </ul>
      <nav aria-label="Request pages" className="mt-8 flex gap-8">
        {queue.page > 1 && (
          <Link
            className="inline-flex min-h-11 items-center text-primary underline"
            href={`/admin/link-requests?page=${queue.page - 1}`}
          >
            Newer requests
          </Link>
        )}
        {queue.hasNext && (
          <Link
            className="inline-flex min-h-11 items-center text-primary underline"
            href={`/admin/link-requests?page=${queue.page + 1}`}
          >
            Older requests
          </Link>
        )}
      </nav>
    </section>
  );
}
