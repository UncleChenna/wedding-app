import { randomInt } from "node:crypto";

/** Six random digits. Leading zeros are kept: a PIN is text, not a number. */
export function newStaffPin(random: (max: number) => number = randomInt): string {
  return String(random(1_000_000)).padStart(6, "0");
}
