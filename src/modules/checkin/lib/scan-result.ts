/** Read-only scan states. None represents a committed admission (TICKET-061). */
export type ScanReadState =
  | "valid"
  | "already_used"
  | "invalid"
  | "revoked"
  | "replaced"
  | "not_rsvped"
  | "unknown"
  | "unavailable"
  | "session_expired";

type Presentation = {
  title: string;
  description: string;
  tone: "success" | "warning" | "danger";
  icon: "check" | "repeat" | "cross" | "ban" | "clock";
};
const presentations: Record<ScanReadState, Presentation> = {
  valid: {
    title: "Valid pass",
    description:
      "Check how many people have arrived. No admission has been recorded by this check.",
    tone: "success",
    icon: "check",
  },
  already_used: {
    title: "Already used",
    description: "All places on this pass are recorded as admitted. Ask the gate lead to check.",
    tone: "warning",
    icon: "repeat",
  },
  invalid: {
    title: "Invalid pass",
    description: "This pass could not be verified. Ask the gate lead for help.",
    tone: "danger",
    icon: "cross",
  },
  revoked: {
    title: "Revoked pass",
    description: "This pass is no longer active. Ask the gate lead for help.",
    tone: "danger",
    icon: "ban",
  },
  replaced: {
    title: "Replaced pass",
    description: "Ask the guest to open their latest pass, or ask the gate lead for help.",
    tone: "danger",
    icon: "ban",
  },
  not_rsvped: {
    title: "Not RSVP’d",
    description: "An attending reply is not recorded. Ask the gate lead to check the guest list.",
    tone: "warning",
    icon: "clock",
  },
  unknown: {
    title: "Not on this device’s list yet",
    description:
      "The signature is valid, but the guest is missing from this list. Ask the gate lead to check.",
    tone: "warning",
    icon: "clock",
  },
  unavailable: {
    title: "Unable to check this pass",
    description: "The guest list is unavailable. Try again or ask the gate lead for help.",
    tone: "warning",
    icon: "clock",
  },
  session_expired: {
    title: "Sign in again",
    description: "Your scanning session has ended. Sign in before checking another pass.",
    tone: "warning",
    icon: "clock",
  },
};

export function scanResultPresentation(state: ScanReadState): Readonly<Presentation> {
  return presentations[state];
}

/** Explicit display-only projection; no storage format or authorization boundary. */
export type ScanGuestDisplay = {
  name: string;
  partySize: number;
  admittedSoFar: number;
  tableNumber: number | null;
  admissions: readonly {
    people: number;
    timeLabel: string;
    staffLabel: string;
    deviceLabel: string;
  }[];
};
