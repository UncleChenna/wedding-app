/** Approved PRD wording. Placeholder rendering belongs to TICKET-052. */
export const invitationVoice = "warm" as const;

/** Other PRD voices remain available for the later settings-driven renderer. */
export const invitationMessages = {
  whatsapp: {
    warm: "Hi {GuestName}, two hearts, one date, and a seat with your name on it. {Couple} are getting married, and the day won't feel whole without you. Your personal invitation is waiting here: {Link}. Open it to RSVP and add anyone tagging along. Keep this link safe: it becomes your entry pass on the day.",
    playful:
      "{GuestName}, consider this your golden ticket. {Couple} are saying 'I do' and you made the list. Tap to unwrap your invitation: {Link}. RSVP, tell us who's coming with you, and hold on to this link, because your gate pass lives inside it.",
    formal:
      "Dear {GuestName}, together with their families, {Couple} request the pleasure of your company as they begin their forever. Kindly view your invitation and respond here: {Link}. This link is yours alone and will serve as your pass on the day.",
  },
  email: {
    subject: "A seat is waiting for you, {GuestName}",
    body: "Some days are written in the stars; ours is written in ink, and we'd love you to be part of it. {Couple} are getting married. Open your personal invitation to RSVP, add your tag-alongs and choose your meals: {Link}. Save this email: the same link holds your entry pass.",
  },
  reminders: {
    rsvp: "Hi {GuestName}, a gentle tap on the shoulder from {Couple}. We're setting tables and menus and we'd hate to plan without you. It takes under a minute: {Link}",
    dayBefore:
      "Tomorrow, {GuestName}! Your entry pass is ready at {Link}. Bring your phone (a screenshot of your QR works too), your appetite and your best dance moves.",
  },
} as const;

export type InvitationVoice = keyof typeof invitationMessages.whatsapp;

export const invitationSiteCopy = {
  headline: "Two stories. One ending: forever.",
  subline: "You've been part of our story. Come and see the best chapter yet.",
  tagAlongPrompt: "Who's walking in with you?",
  confirmed: "You're in. We're already saving you a dance.",
  declined: "We'll miss you, and we'll raise a glass in your name.",
  qrPass: "This is your key to the celebration. Show it at the door.",
  gateValid: "Welcome, {GuestName}. Table {N} is ready for you.",
  orderHeading: "Hungry? Thirsty? Say the word.",
  orderSent: "On its way. Sit back, we've got this.",
  orderServed: "Enjoy every bite.",
  editsLocked: "The big day is here, so your RSVP is locked. See you inside.",
  attendance: {
    yes: "Count me in",
    no: "I'll be there in spirit",
  },
} as const;
