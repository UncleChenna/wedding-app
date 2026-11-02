import { QrCode } from "@/modules/shared/components/ui/qr-code";
import type { PassView } from "@/modules/checkin/lib/pass-eligibility";

export function QrPass({ url, pass, pdfUrl }: { url: string; pass: PassView; pdfUrl?: string }) {
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
      {pdfUrl ? (
        <div>
          <a
            href={pdfUrl + "?scheme=light"}
            referrerPolicy="no-referrer"
            className="inline-flex min-h-11 min-w-11 items-center py-2 text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring dark:hidden"
          >
            Download invitation PDF
          </a>
          <a
            href={pdfUrl + "?scheme=dark"}
            referrerPolicy="no-referrer"
            className="hidden min-h-11 min-w-11 items-center py-2 text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring dark:inline-flex"
          >
            Download invitation PDF
          </a>
        </div>
      ) : null}
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
