"use client";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import { Select } from "@/modules/shared/components/ui/select";
import { Textarea } from "@/modules/shared/components/ui/textarea";
import type { PartyDetails, PartyPerson, PartyState } from "../lib/party";
import { updateParty } from "../server/party-actions";

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

function initialPeople(details: PartyDetails): PartyPerson[] {
  return details.people.length
    ? details.people
    : [{ id: "", name: "", mealChoice: "", dietaryNotes: "", isPrimary: true }];
}
export function PartyForm({ token, details }: { token: string; details: PartyDetails }) {
  const enhanced = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const [source, setSource] = useState(details);
  const [people, setPeople] = useState(() => initialPeople(details));
  const [state, action, pending] = useActionState<PartyState, FormData>(updateParty, {
    status: "idle",
    message: "",
  });
  const notice = useRef<HTMLParagraphElement>(null);
  const previous = useRef(state);
  const container = useRef<HTMLFormElement>(null);
  const focusName = useRef<number | null>(null);
  if (source !== details) {
    setSource(details);
    setPeople(initialPeople(details));
  }
  useEffect(() => {
    if (state !== previous.current && state.message) notice.current?.focus();
    previous.current = state;
  }, [state]);
  useEffect(() => {
    if (focusName.current !== null) {
      container.current
        ?.querySelector<HTMLInputElement>('[data-person-name="' + focusName.current + '"]')
        ?.focus();
      focusName.current = null;
    }
  }, [people.length]);
  const tagAlongs = people.filter((person) => !person.isPrimary).length;
  function change(index: number, field: "name" | "mealChoice" | "dietaryNotes", value: string) {
    setPeople((rows) =>
      rows.map((row, position) => (position === index ? { ...row, [field]: value } : row)),
    );
  }
  return (
    <section className="mt-12 border-t border-border pt-8" aria-labelledby="party-heading">
      <h2 id="party-heading" className="type-heading">
        Who’s walking in with you?
      </h2>
      <p className="mt-6 text-base leading-relaxed">
        Your invitation has room for {details.maxTagAlongs}{" "}
        {details.maxTagAlongs === 1 ? "tag-along" : "tag-alongs"}. Tell us everyone’s name and what
        they’d like to eat.
      </p>
      <noscript>
        <p className="mt-6 text-base leading-relaxed">
          Please enable JavaScript to edit your guest details, or contact the couple for help.
        </p>
      </noscript>
      <form
        ref={container}
        action={action}
        // Server actions reset native controls after completion. These fields remain
        // controlled by the saved/draft people state; a native reset can clear selects.
        onReset={(event) => event.preventDefault()}
        className="mt-8 space-y-8 pb-[env(safe-area-inset-bottom)]"
      >
        <input type="hidden" name="token" value={token} />
        <input
          type="hidden"
          name="people"
          value={JSON.stringify(
            people.map(({ id, name, mealChoice, dietaryNotes }) => ({
              id,
              name,
              mealChoice,
              dietaryNotes,
            })),
          )}
        />
        {people.map((person, index) => (
          <fieldset
            key={person.id || "new-" + index}
            disabled={!enhanced || pending || state.status === "locked"}
            className="min-w-0 space-y-6"
          >
            <legend className="mb-6 text-lg font-medium">
              {person.isPrimary ? "Named invitee" : "Tag-along"} {index + 1}
            </legend>
            <Input
              label="Full name"
              data-person-name={index}
              autoComplete="off"
              required
              maxLength={200}
              value={person.name}
              onChange={(event) => change(index, "name", event.target.value)}
            />
            <Select
              label="Meal choice"
              value={person.mealChoice}
              required={details.meals.length > 0}
              onChange={(event) => change(index, "mealChoice", event.target.value)}
            >
              <option value="">{details.meals.length ? "Choose a meal" : "Menu to follow"}</option>
              {person.mealChoice &&
                !details.meals.some((meal) => meal.id === person.mealChoice) && (
                  <option value={person.mealChoice}>Your saved meal (no longer offered)</option>
                )}
              {details.meals.map((meal) => (
                <option key={meal.id} value={meal.id}>
                  {meal.name}
                </option>
              ))}
            </Select>
            <Textarea
              label="Dietary notes (optional)"
              hint="Share allergies or dietary needs. These details are for you, the couple and kitchen staff."
              maxLength={1000}
              rows={3}
              value={person.dietaryNotes}
              onChange={(event) => change(index, "dietaryNotes", event.target.value)}
            />
            {!person.isPrimary && (
              <Button
                type="button"
                variant="secondary"
                aria-label={"Remove guest: " + (person.name || "tag-along " + (index + 1))}
                onClick={() => {
                  focusName.current = Math.max(0, index - 1);
                  setPeople((rows) => rows.filter((_, position) => position !== index));
                }}
              >
                Remove guest
              </Button>
            )}
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={
            !enhanced || pending || state.status === "locked" || tagAlongs >= details.maxTagAlongs
          }
          onClick={() => {
            focusName.current = people.length;
            setPeople((rows) => [
              ...rows,
              { id: "", name: "", mealChoice: "", dietaryNotes: "", isPrimary: false },
            ]);
          }}
        >
          Add tag-along
        </Button>
        <p className="text-base leading-relaxed">
          {people.length} {people.length === 1 ? "person" : "people"} attending. Changes are saved
          when you choose “Save guest details”.
        </p>
        <p
          ref={notice}
          role="status"
          aria-label="Guest details"
          tabIndex={-1}
          className="min-h-12 text-base leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {state.message}
        </p>
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={!enhanced || pending || state.status === "locked"}
          aria-busy={pending}
        >
          {pending ? "Saving details…" : "Save guest details"}
        </Button>
      </form>
    </section>
  );
}
