export type StaffSignInState = {
  message: string;
  status: "idle" | "wrong" | "expired" | "locked" | "unavailable";
};

export const staffSignInMessages = {
  wrong: "That PIN didn’t match this station. Please try again.",
  expired: "This PIN has expired. Please ask your team lead for help.",
  locked: "Too many attempts. Please wait ten minutes before trying again.",
  unavailable: "Staff sign-in isn’t ready just now. Please ask your team lead for help.",
} as const;
