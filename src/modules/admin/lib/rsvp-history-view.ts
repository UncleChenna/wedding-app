import { z } from "zod";
const snapshot = z.object({
  status: z.enum(["draft", "sent", "rsvp_yes", "rsvp_no", "revoked"]),
  rsvp: z
    .object({ attending: z.boolean(), countAttending: z.number().int().nonnegative() })
    .nullable(),
  people: z.array(
    z.object({
      name: z.string(),
      isPrimary: z.boolean(),
      mealChoice: z.string().nullable(),
      dietaryNotes: z.string().nullable(),
    }),
  ),
});
export type HistorySnapshot = z.infer<typeof snapshot>;
/** Strip everything outside the audit display contract, including unknown legacy fields. */
export function historySnapshot(
  value: unknown,
  meals: ReadonlyMap<string, string> = new Map(),
): HistorySnapshot | null {
  const parsed = snapshot.safeParse(value);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    people: parsed.data.people.map((person) => {
      if (!person.mealChoice || !z.uuid().safeParse(person.mealChoice).success) return person;
      const name = meals.get(person.mealChoice);
      return {
        ...person,
        mealChoice: name ? `${name} (current menu name)` : "Recorded meal; menu item unavailable",
      };
    }),
  };
}
export function historyActor(actor: string): string {
  return actor === "guest" ? "Guest" : actor.startsWith("admin:") ? "Admin" : "Recorded update";
}
export type RsvpHistoryEntry = {
  id: string;
  changedAt: string;
  actor: string;
  before: HistorySnapshot | null;
  after: HistorySnapshot | null;
};
