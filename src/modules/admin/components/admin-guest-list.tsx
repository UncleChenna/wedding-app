import { RetryButton } from "@/modules/shared/components/retry-button";
import { getGuestList } from "../server/guest-list";
import { GuestList } from "./guest-list";

export async function AdminGuestList() {
  const result = await getGuestList();
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Guests</h1>
      <p className="mt-6 max-w-prose">
        Find your guests, check their replies and manage each invitation.
      </p>
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
