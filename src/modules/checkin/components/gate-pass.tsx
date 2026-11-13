import { appRoutes } from "@/modules/shared/lib/routes";
import Link from "next/link";
import { CenteredPanel } from "@/modules/shared/components/ui/centered-panel";

import { QrCode } from "@/modules/shared/components/ui/qr-code";

import type { PassResolution } from "../lib/pass-eligibility";

/** Provisional guest copy (design principles §8); one heading and one sentence per state. */
export const gatePassCopy = {
  replaced: {
    title: "This pass has been replaced",
    body: "We have sent you a newer pass. Please open the latest link from us.",
  },
  revoked: {
    title: "This pass is no longer active",
    body: "Please get in touch with the couple and they will help you.",
  },
  "not-attending": {
    title: "No seats on this pass yet",
    body: "Once you reply yes on your personal invitation, your pass will be ready here.",
  },
  invalid: {
    title: "We could not find this pass",
    body: "Please check that you opened the full link we sent you.",
  },
  unavailable: {
    title: "Passes are not ready yet",
    body: "Please check back closer to the day.",
  },
} as const;

const linkStyle =
  "inline-flex min-h-11 min-w-11 items-center py-2 text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

function partySizeLabel(count: number) {
  return count === 1 ? "1 guest" : `${count} guests`;
}

/** Read-only pass display. It holds no RSVP controls and never links to the personal invitation. */
export function GatePass({ resolution, passUrl }: { resolution: PassResolution; passUrl: string }) {
  if (resolution.state !== "valid") {
    const copy = gatePassCopy[resolution.state];
    return (
      <CenteredPanel
        eyebrow="Your gate pass"
        title={copy.title}
        description={copy.body}
        footer={
          <Link href={appRoutes.home.path} prefetch={false} className={linkStyle}>
            Back to our day
          </Link>
        }
      />
    );
  }

  const { pass } = resolution;
  const heading = pass.names.join(" & ") || pass.householdName || "Our dear guest";
  return (
    <CenteredPanel
      eyebrow="Your gate pass"
      title={<span className="wrap-anywhere">{heading}</span>}
      description={
        pass.householdName && pass.names.length > 0 ? (
          <span className="wrap-anywhere">{pass.householdName}</span>
        ) : undefined
      }
      footer={
        <Link href={appRoutes.home.path} prefetch={false} className={linkStyle}>
          Back to our day
        </Link>
      }
    >
      <dl className="grid grid-cols-2 gap-6 text-center text-lg leading-relaxed">
        <div>
          <dt className="type-label text-primary">Admits</dt>
          <dd className="mt-2">{partySizeLabel(pass.partySize)}</dd>
        </div>
        <div>
          <dt className="type-label text-primary">Table</dt>
          <dd className="mt-2">{pass.tableNumber ?? "To follow"}</dd>
        </div>
      </dl>
      <div className="mx-auto mt-8 w-full max-w-xs">
        <QrCode value={passUrl} label={`Gate pass QR code for ${heading}`} />
      </div>
      <p className="mt-6 text-center text-base leading-relaxed">
        Show this at the gate. Each seat on the pass can be used once.
      </p>
    </CenteredPanel>
  );
}
