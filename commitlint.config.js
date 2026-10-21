// Ticket commits ("TICKET-014: add RSVP form validation") are checked by
// scripts/harness/commit-rules.mjs; everything else stays Conventional Commits.
const config = {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => /^(?:TICKET|WED)-\d{3}: \S/.test(message)],
};

export default config;
