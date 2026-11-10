import { Card, CardContent } from "@/modules/shared/components/ui/card";
import { StatusBadge } from "@/modules/shared/components/ui/status-panel";
import {
  scanResultPresentation,
  type ScanGuestDisplay,
  type ScanReadState,
} from "../lib/scan-result";

/** Read-only presentation; admission confirmation belongs to the committed write flow. */
export function ScanResultPanel({
  state,
  guest,
}: {
  state: ScanReadState;
  guest?: ScanGuestDisplay;
}) {
  const result = scanResultPresentation(state);
  const visibleGuest = state === "valid" || state === "already_used" ? guest : undefined;
  return (
    <Card role="status" aria-live="polite" aria-atomic="true">
      <CardContent className="flex flex-col gap-6 text-lg leading-relaxed">
        <div className="flex flex-col items-start gap-3">
          <StatusBadge tone={result.tone} icon={result.icon}>
            Pass check
          </StatusBadge>
          <h2 className="font-display text-4xl leading-tight wrap-anywhere">{result.title}</h2>
          <p>{result.description}</p>
        </div>
        {visibleGuest && (
          <div className="flex flex-col gap-3">
            <p className="font-display text-4xl leading-tight wrap-anywhere">{visibleGuest.name}</p>
            <p className="text-3xl font-semibold">
              {visibleGuest.tableNumber === null
                ? "Table not assigned"
                : `Table ${visibleGuest.tableNumber}`}
            </p>
            <p>
              Party of {visibleGuest.partySize} · {visibleGuest.admittedSoFar} admitted so far
            </p>
            {state === "valid" && (
              <p>
                {visibleGuest.partySize - visibleGuest.admittedSoFar}{" "}
                {visibleGuest.partySize - visibleGuest.admittedSoFar === 1 ? "place" : "places"}{" "}
                remaining
              </p>
            )}
            {state === "already_used" && (
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Recorded arrivals</h3>
                {visibleGuest.admissions.length ? (
                  <ul className="flex flex-col gap-3">
                    {visibleGuest.admissions.map((arrival, index) => (
                      <li key={index} className="wrap-anywhere">
                        {arrival.people} admitted · {arrival.timeLabel}
                        <br />
                        {arrival.staffLabel} · {arrival.deviceLabel}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Earlier arrival details are unavailable. Ask the gate lead to check.</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
