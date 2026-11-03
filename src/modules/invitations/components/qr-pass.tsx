import { SavePassImage } from "./save-pass-image";
import { OfflinePassSave } from "./offline-pass-save";
import { QrCode } from "@/modules/shared/components/ui/qr-code";
import type { PassView } from "@/modules/checkin/lib/pass-eligibility";

export function QrPass({
  url,
  pass,
  imageHref,
  saveOffline = false,
}: {
  url: string;
  pass: PassView;
  imageHref?: string;
  saveOffline?: boolean;
}) {
  const name = pass.names.join(" & ") || pass.householdName || "Our dear guest";
  return (
    <div className="mx-auto max-w-md">
      <p className="type-label text-primary">Your entry pass</p>
      <h2 className="mt-6 type-heading wrap-anywhere">{name}</h2>
      <p className="mt-6 text-base leading-relaxed">
        This is your key to the celebration. Show it at the door.
      </p>
      <div className="mt-8 max-w-sm rounded-lg border border-border bg-surface p-3">
        <QrCode value={url} label={`Entry pass QR code for ${name}`} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-6 text-base leading-relaxed">
        <div>
          <dt className="type-label text-primary">Admits</dt>
          <dd className="mt-2">
            {pass.partySize} {pass.partySize === 1 ? "guest" : "guests"}
          </dd>
        </div>
        <div>
          <dt className="type-label text-primary">Table</dt>
          <dd className="mt-2">{pass.tableNumber ?? "To follow"}</dd>
        </div>
      </dl>
      <a
        href={url}
        referrerPolicy="no-referrer"
        className="mt-8 inline-flex min-h-11 min-w-11 items-center py-2 text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Open your pass
      </a>
      {imageHref && <SavePassImage href={imageHref} />}
      {saveOffline ? <OfflinePassSave /> : null}
    </div>
  );
}

export function PassUnavailable() {
  return (
    <p role="status" className="mt-6 text-base leading-relaxed">
      Your reply is saved. Your pass is not ready just yet. Please check back soon.
    </p>
  );
}
