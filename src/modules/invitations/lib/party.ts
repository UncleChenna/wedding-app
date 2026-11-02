import { z } from "zod";

export interface PartyPerson {
  id: string;
  name: string;
  mealChoice: string;
  dietaryNotes: string;
  isPrimary: boolean;
}
export interface MealOption {
  id: string;
  name: string;
}
export interface PartyDetails {
  people: PartyPerson[];
  meals: MealOption[];
  maxTagAlongs: number;
}
export interface PartyState {
  status: "idle" | "saved" | "error";
  message: string;
}

const personSchema = z
  .object({
    id: z.union([z.uuid(), z.literal("")]),
    name: z.string().trim().min(1).max(200),
    mealChoice: z.string().max(200),
    dietaryNotes: z.string().trim().max(1000),
  })
  .strict();
export const partyInputSchema = z.array(personSchema).min(1).max(300);

export function validateParty(
  input: unknown,
  stored: Pick<PartyPerson, "id" | "isPrimary" | "mealChoice">[],
  maxTagAlongs: number,
  meals: MealOption[],
) {
  const parsed = partyInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: "Please add a name for everyone and keep dietary notes under 1,000 characters.",
    } as const;
  const seen = new Set<string>();
  const primary = stored.filter((person) => person.isPrimary);
  const people: PartyPerson[] = [];
  for (const [index, person] of parsed.data.entries()) {
    const existing = stored.find((row) => row.id === person.id);
    if (person.id && (!existing || seen.has(person.id)))
      return {
        ok: false,
        message: "Your guest list has changed. Please reload your invitation and try again.",
      } as const;
    if (person.id) seen.add(person.id);
    const unchangedMeal = Boolean(
      existing?.mealChoice && existing.mealChoice === person.mealChoice,
    );
    if (
      !unchangedMeal &&
      !meals.some((meal) => meal.id === person.mealChoice) &&
      (meals.length > 0 || person.mealChoice !== "")
    ) {
      return { ok: false, message: "Please choose an available meal for everyone." } as const;
    }
    people.push({
      ...person,
      isPrimary: existing?.isPrimary ?? (primary.length === 0 && index === 0),
    });
  }
  if (primary.some((person) => !seen.has(person.id)))
    return { ok: false, message: "Please keep every named invitee in your guest list." } as const;
  if (people.filter((person) => !person.isPrimary).length > maxTagAlongs) {
    return {
      ok: false,
      message:
        "Your invitation has room for " +
        maxTagAlongs +
        (maxTagAlongs === 1 ? " tag-along." : " tag-alongs."),
    } as const;
  }
  return { ok: true, people, countAttending: people.length } as const;
}
