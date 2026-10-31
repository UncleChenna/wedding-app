import Link from "next/link";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { listThemes, themeStyle } from "@/modules/theming";
import { InvitationLetter } from "./invitation-letter";

export function InvitationLetterPreview({
  selectedTheme,
  sample = false,
}: {
  selectedTheme?: string;
  sample?: boolean;
}) {
  const themes = listThemes();
  const theme = themes.find((item) => item.id === selectedTheme);
  const details = sample
    ? {
        ...defaultEventSettings,
        venue: "Sample Garden — preview only",
        ceremonyTime: "15:30",
        timeZone: "Etc/UTC",
        dressCode: "Sample: formal attire",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Kew+Gardens+London",
      }
    : defaultEventSettings;
  return (
    <div style={theme && themeStyle(theme)} className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 pt-6 md:px-12">
        <p className="text-base leading-relaxed">
          Personal invitation preview · sample guest · no reply is sent here.
        </p>
        {sample && (
          <p className="mt-4 text-base leading-relaxed">
            Venue, time, time zone and dress code below are sample details, not the wedding
            arrangements.
          </p>
        )}
        <nav aria-label="Preview theme" className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {themes.map((item) => (
            <Link
              key={item.id}
              href={`/dev/invitation/letter?theme=${item.id}${sample ? "&details=sample" : ""}`}
              aria-current={theme?.id === item.id ? "page" : undefined}
              className="inline-flex min-h-11 min-w-11 items-center text-primary underline underline-offset-4"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <InvitationLetter details={details} greeting="Dear Amara,">
        <section className="border-t border-border pt-8">
          <h2 className="type-heading">Will you join us?</h2>
          <p className="mt-6 text-lg leading-relaxed">
            Your personal invitation lets you save your reply. This preview does not send an RSVP.
          </p>
          <Link
            href="/dev/rsvp"
            className="mt-6 inline-flex min-h-11 min-w-11 items-center text-primary underline underline-offset-4"
          >
            Try RSVP preview
          </Link>
        </section>
        <Link
          href="/dev"
          className="mt-8 inline-flex min-h-11 min-w-11 items-center text-primary underline underline-offset-4"
        >
          Back to previews
        </Link>
      </InvitationLetter>
    </div>
  );
}
