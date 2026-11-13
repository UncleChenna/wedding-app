import Link from "next/link";
import { CenteredPanel, panelLinkClassName } from "@/modules/shared/components/ui/centered-panel";
import { appRoutes } from "@/modules/shared/lib/routes";
import { eventSummary, type PublicEventDetails } from "../lib/event-summary";

export function InvitationGuide({ settings }: { settings: PublicEventDetails }) {
  const summary = eventSummary(settings);
  return (
    <CenteredPanel
      eyebrow={summary.title}
      title={
        <>
          An invitation <span className="block">just for you</span>
        </>
      }
      description={
        <>
          <p>
            Your personal invitation will arrive as a link from us. Keep it close — it will be your
            way to reply and find the details for our celebration.
          </p>
          <p className="mt-4 text-balance text-foreground">Save the date: {summary.date}.</p>
        </>
      }
      footer={
        <Link prefetch={false} href={appRoutes.home.path} className={panelLinkClassName}>
          Back to our day
        </Link>
      }
    >
      <section aria-labelledby="find-invitation" className="text-center">
        <h2 id="find-invitation" className="font-display text-3xl leading-tight">
          Need your link?
        </h2>
        <p className="mt-4 text-lg leading-relaxed">
          Can’t find your invitation? Ask the person who invited you to send your link again.
        </p>
        <Link href={appRoutes.lostLink.path} className={`mt-4 ${panelLinkClassName}`}>
          Request your invitation link
        </Link>
      </section>
    </CenteredPanel>
  );
}
