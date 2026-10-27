import { useId, type ReactNode } from "react";

import { cn } from "../../lib/cn";

/** Fixed status colour families (theme tokens; meanings fixed in every theme, THM-4). */
export type StatusTone = "success" | "warning" | "danger";

/** Gate scan results (PRD CHK-2). */
export const SCAN_STATUSES = ["valid", "used", "invalid", "revoked", "not-rsvpd"] as const;
export type ScanStatus = (typeof SCAN_STATUSES)[number];

export type StatusIconName = "check" | "repeat" | "cross" | "ban" | "clock";

interface Appearance {
  tone: StatusTone;
  label: string;
  icon: StatusIconName;
}

/**
 * Valid is green; already used and not RSVP'd are amber (stop and check, not a refusal);
 * invalid and revoked are red (a problem). Each status has its own icon and label so
 * the meaning never depends on colour.
 */
const APPEARANCE: Record<ScanStatus, Appearance> = {
  valid: { tone: "success", label: "Valid", icon: "check" },
  used: { tone: "warning", label: "Already used", icon: "repeat" },
  "not-rsvpd": { tone: "warning", label: "Not RSVP'd", icon: "clock" },
  invalid: { tone: "danger", label: "Invalid", icon: "cross" },
  revoked: { tone: "danger", label: "Revoked", icon: "ban" },
};

export function statusAppearance(status: ScanStatus): Appearance {
  return APPEARANCE[status];
}

// Literal class names so Tailwind can see them.
const PANEL: Record<StatusTone, string> = {
  success: "bg-success-subtle text-success-subtle-foreground border-success",
  warning: "bg-warning-subtle text-warning-subtle-foreground border-warning",
  danger: "bg-danger-subtle text-danger-subtle-foreground border-danger",
};
const BADGE: Record<StatusTone, string> = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
};
const TONE_ICON: Record<StatusTone, StatusIconName> = {
  success: "check",
  warning: "clock",
  danger: "cross",
};

const PATHS: Record<StatusIconName, ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  repeat: (
    <>
      <path d="M17 2l3 3-3 3" />
      <path d="M4 11V9a4 4 0 0 1 4-4h12" />
      <path d="M7 22l-3-3 3-3" />
      <path d="M20 13v2a4 4 0 0 1-4 4H4" />
    </>
  ),
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
};

function StatusIcon({
  name,
  label,
  className,
}: {
  name: StatusIconName;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {PATHS[name]}
    </svg>
  );
}

export interface StatusPanelProps {
  status: ScanStatus;
  /** The main thing staff read at arm's length: a guest name or "Table 12". */
  identifier: string;
  /** Supporting line, e.g. "Party of 2 · Table 7" or "Admitted 19:42 at Gate 1". */
  detail?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Large, high-contrast result for staff screens (≥32px identifier, ≥18px text). */
export function StatusPanel({ status, identifier, detail, children, className }: StatusPanelProps) {
  const { tone, label, icon } = APPEARANCE[status];
  const labelId = useId();
  return (
    <section
      aria-labelledby={labelId}
      data-status={status}
      data-tone={tone}
      className={cn("flex flex-col gap-3 rounded-lg border-2 p-5 sm:p-6", PANEL[tone], className)}
    >
      <div className="flex items-center gap-3">
        <StatusIcon name={icon} label={`${label} icon`} className="size-10" />
        <p
          data-testid="status-label"
          id={labelId}
          className="text-lg font-semibold tracking-wider uppercase"
        >
          {label}
        </p>
      </div>
      <p
        data-testid="status-identifier"
        // `anywhere`, not `break-word`: it also lowers the min-content width, so a long
        // single-word name cannot stretch the grid around the panel on a phone.
        className="font-display text-4xl leading-tight font-medium wrap-anywhere"
      >
        {identifier}
      </p>
      {detail ? (
        <p data-testid="status-detail" className="text-lg leading-relaxed">
          {detail}
        </p>
      ) : null}
      {children}
    </section>
  );
}

export interface StatusBadgeProps {
  tone: StatusTone;
  /** Override the tone icon when the label has a more specific meaning. */
  icon?: StatusIconName;
  children: ReactNode;
  className?: string;
}

/** Compact status for board cards: icon + text on the solid status colour. */
export function StatusBadge({ tone, icon, children, className }: StatusBadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-lg font-semibold",
        BADGE[tone],
        className,
      )}
    >
      <StatusIcon name={icon ?? TONE_ICON[tone]} className="size-5" />
      {children}
    </span>
  );
}
