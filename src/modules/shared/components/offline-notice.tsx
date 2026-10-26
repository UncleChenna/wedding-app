import { RetryButton } from "./retry-button";
import { Divider } from "./ui";

/**
 * Body of the precached offline page (TICKET-106). It is shown at whatever URL failed to
 * load, so it must stay generic: no guest data, nothing request-specific. The "Try again"
 * action sits at the bottom on phones, within thumb reach.
 */
export function OfflineNotice() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-16 pb-[max(2rem,env(safe-area-inset-bottom))] text-center sm:justify-center sm:pb-16">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 sm:flex-none">
        <p className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">No signal</p>
        <h1 className="font-display text-4xl leading-tight font-medium text-balance sm:text-5xl">
          You&apos;re offline
        </h1>
        <Divider className="max-w-48" />
        <p className="max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
          The signal dropped for a moment. Your invitation will be right here as soon as you&apos;re
          connected again.
        </p>
      </div>
      <div className="mt-10 flex justify-center">
        <RetryButton />
      </div>
    </main>
  );
}
