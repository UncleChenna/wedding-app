import "server-only";

/** Public transaction-level history API for authorized admin corrections.
 * Callers must hold the invitation row lock and pass an authenticated actor.
 */
export { readRsvpSnapshot, recordRsvpChange } from "./server/rsvp-history";
