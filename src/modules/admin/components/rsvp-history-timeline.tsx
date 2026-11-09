import type { HistorySnapshot, RsvpHistoryEntry } from "../lib/rsvp-history-view";
const statuses = {
  draft: "Draft",
  sent: "Sent",
  rsvp_yes: "Attending",
  rsvp_no: "Not attending",
  revoked: "Revoked",
};
function Snapshot({ value, title }: { value: HistorySnapshot | null; title: string }) {
  return (
    <section className="min-w-0 space-y-3 wrap-anywhere">
      <h3 className="font-display text-2xl">{title}</h3>
      {!value ? (
        <p className="text-muted-foreground">Details were not recorded in this snapshot.</p>
      ) : (
        <>
          <p>
            {statuses[value.status]} ·{" "}
            {value.rsvp ? `${value.rsvp.countAttending} in saved reply` : "No reply yet"}
          </p>
          {value.people.length ? (
            <ul className="space-y-4">
              {value.people.map((person, index) => (
                <li key={index}>
                  <p>
                    {person.name}
                    {person.isPrimary ? " · Primary guest" : " · Companion"}
                  </p>
                  <p className="text-muted-foreground">
                    Meal: {person.mealChoice || "Not selected"}
                  </p>
                  <p className="text-muted-foreground">
                    Dietary needs: {person.dietaryNotes || "None recorded"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No named guests recorded.</p>
          )}
        </>
      )}
    </section>
  );
}
export function RsvpHistoryTimeline({ entries }: { entries: readonly RsvpHistoryEntry[] }) {
  if (!entries.length)
    return <p className="mt-10">No reply changes have been recorded for this invitation yet.</p>;
  return (
    <ol aria-label="Reply changes, newest first" className="mt-10 divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id} data-history-entry={entry.id} className="space-y-6 py-8 first:pt-0">
          <h2 className="font-display text-2xl">{entry.actor} update</h2>
          <p>
            <time dateTime={entry.changedAt}>
              {entry.changedAt.replace("T", " ").replace(/\.\d+Z$/, " UTC")}
            </time>
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            <Snapshot title="Before" value={entry.before} />
            <Snapshot title="After" value={entry.after} />
          </div>
        </li>
      ))}
    </ol>
  );
}
