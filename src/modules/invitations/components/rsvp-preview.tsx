"use client";
import { appRoutes } from "@/modules/shared/lib/routes";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Input, RadioGroup, Select } from "@/modules/shared/components/ui";
import { themeStyle, type Theme } from "@/modules/theming";
import {
  mealLabel,
  rsvpPartySchema,
  SAMPLE_COMPANION_LIMIT,
  SAMPLE_MEALS,
  sampleParty,
  type PartyDraft,
} from "../lib/rsvp-preview";

type Step = "attendance" | "party" | "review" | "confirmation";
const titles: Record<Exclude<Step, "confirmation">, string> = {
  attendance: "Will you join us?",
  party: "Who's walking in with you?",
  review: "Your reply, at a glance",
};

function MealChoice({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <Select
      id={id}
      label="Meal choice"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      required
    >
      <option value="">Choose a sample meal</option>
      {SAMPLE_MEALS.map((meal) => (
        <option key={meal.value} value={meal.value}>
          {meal.label}
        </option>
      ))}
    </Select>
  );
}

export function RsvpPreview({ themes }: { themes: readonly Theme[] }) {
  // "" follows the device light/dark setting, like the real site; a theme id pins the preview.
  const [themeId, setThemeId] = useState("");
  const [step, setStep] = useState<Step>("attendance");
  const [attendance, setAttendance] = useState("");
  const [party, setParty] = useState<PartyDraft>(sampleParty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const nextId = useRef(1);
  const previousCount = useRef(0);
  const theme = themes.find((theme) => theme.id === themeId);
  const attending = attendance === "yes";
  const title =
    step === "confirmation"
      ? attending
        ? "You're in. We're already saving you a dance."
        : "We'll miss you, and we'll raise a glass in your name."
      : titles[step];

  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (!Object.keys(errors).length) return;
    const invalid = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    const target = invalid?.matches("input,select")
      ? invalid
      : invalid?.querySelector<HTMLInputElement>("input");
    target?.focus();
  }, [errors]);
  useEffect(() => {
    if (step === "party" && previousCount.current !== party.guests.length) {
      const newest = party.guests.at(-1);
      const target =
        party.guests.length > previousCount.current && newest
          ? `guest-${newest.id}-name`
          : "add-companion";
      document.getElementById(target)?.focus();
    }
    previousCount.current = party.guests.length;
  }, [party.guests, step]);

  function go(next: Step) {
    setErrors({});
    setStep(next);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "attendance") {
      if (!attendance) {
        setErrors({ attendance: "Please tell us whether you can join us." });
        return;
      }
      go(attending ? "party" : "review");
    } else if (step === "party") {
      const result = rsvpPartySchema.safeParse(party);
      if (!result.success) {
        setErrors(
          Object.fromEntries(
            result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
          ),
        );
        return;
      }
      setParty(result.data);
      go("review");
    } else if (step === "review") go("confirmation");
  }
  function updateGuest(id: number, field: "name" | "meal", value: string) {
    setParty((party) => ({
      ...party,
      guests: party.guests.map((guest) => (guest.id === id ? { ...guest, [field]: value } : guest)),
    }));
  }
  function restart() {
    setParty(sampleParty());
    setAttendance("");
    nextId.current = 1;
    go("attendance");
  }

  return (
    <div
      style={theme && themeStyle(theme)}
      className="min-h-dvh bg-background font-sans text-foreground [&_label]:text-base [&_legend]:text-base [&_p]:text-base"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-6 md:px-12">
        <Link
          href={appRoutes.dev.path}
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Back to previews
        </Link>
        <div className="w-full max-w-xs">
          <Select
            id="rsvp-preview-theme"
            label="Preview theme"
            value={themeId}
            onChange={(event) => setThemeId(event.target.value)}
          >
            <option value="">Match my device</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <main className="mx-auto grid max-w-6xl gap-12 px-6 pt-8 pb-16 md:grid-cols-[1fr_2fr] md:px-12 md:pt-16">
        <aside className="space-y-6">
          <p className="tracking-widest text-primary uppercase">The celebration</p>
          <div className="font-display text-3xl leading-tight md:text-4xl">
            Uchenna &amp; Adaora
          </div>
          <p className="leading-relaxed">19 December 2026</p>
          <p className="max-w-prose leading-relaxed">
            Preview only. Responses are not sent or saved. Names, meal choices and the two-companion
            allowance are samples.
          </p>
        </aside>
        <section className="min-w-0">
          <p className="mb-6 text-primary">
            {step === "confirmation"
              ? "Sample confirmation"
              : `Step ${step === "attendance" ? 1 : step === "party" ? 2 : attending ? 3 : 2} of ${attending ? 3 : attendance === "no" ? 2 : 3}`}
          </p>
          <h1
            ref={heading}
            tabIndex={-1}
            className="font-display text-4xl leading-tight tracking-tight wrap-anywhere focus:outline-none md:text-5xl"
          >
            {title}
          </h1>
          {step === "confirmation" ? (
            <div className="mt-8 space-y-8">
              <p className="leading-relaxed">
                No RSVP has been sent. This is a sample confirmation for you to explore.
              </p>
              {attending && <PartySummary party={party} />}
              <Button onClick={restart}>Start again</Button>
            </div>
          ) : (
            <form ref={form} onSubmit={submit} noValidate className="mt-8 space-y-8">
              {step === "attendance" && (
                <RadioGroup
                  name="attendance"
                  legend="Can you make it?"
                  options={[
                    { value: "yes", label: "Count me in" },
                    { value: "no", label: "I'll be there in spirit" },
                  ]}
                  value={attendance}
                  onValueChange={setAttendance}
                  error={errors.attendance}
                  required
                />
              )}
              {step === "party" && (
                <>
                  <p className="leading-relaxed">
                    Start with your details, then add anyone joining you. This sample invitation has
                    room for up to two companions.
                  </p>
                  <fieldset className="space-y-6">
                    <legend className="mb-6 font-medium">Your details</legend>
                    <Input
                      id="rsvp-name"
                      label="Your name"
                      value={party.name}
                      maxLength={80}
                      autoComplete="off"
                      required
                      error={errors.name}
                      onChange={(event) => setParty({ ...party, name: event.target.value })}
                    />
                    <MealChoice
                      id="rsvp-meal"
                      value={party.meal}
                      error={errors.meal}
                      onChange={(meal) => setParty({ ...party, meal })}
                    />
                  </fieldset>
                  {party.guests.map((guest, index) => (
                    <fieldset key={guest.id} className="space-y-6 border-t border-border pt-6">
                      <legend className="pt-6 font-medium">Companion {index + 1}</legend>
                      <Input
                        id={`guest-${guest.id}-name`}
                        label={`Companion ${index + 1} name`}
                        value={guest.name}
                        maxLength={80}
                        autoComplete="off"
                        required
                        error={errors[`guests.${index}.name`]}
                        onChange={(event) => updateGuest(guest.id, "name", event.target.value)}
                      />
                      <MealChoice
                        id={`guest-${guest.id}-meal`}
                        value={guest.meal}
                        error={errors[`guests.${index}.meal`]}
                        onChange={(meal) => updateGuest(guest.id, "meal", meal)}
                      />
                      <Button
                        variant="ghost"
                        aria-label={`Remove companion ${index + 1}`}
                        onClick={() => {
                          setErrors({});
                          setParty({
                            ...party,
                            guests: party.guests.filter((item) => item.id !== guest.id),
                          });
                        }}
                      >
                        Remove companion
                      </Button>
                    </fieldset>
                  ))}
                  <div className="space-y-3">
                    {party.guests.length === 0 && (
                      <p className="leading-relaxed">
                        Just you so far. You can continue without adding anyone.
                      </p>
                    )}
                    <Button
                      id="add-companion"
                      variant="secondary"
                      disabled={party.guests.length >= SAMPLE_COMPANION_LIMIT}
                      onClick={() => {
                        const id = nextId.current++;
                        setErrors({});
                        setParty({
                          ...party,
                          guests: [...party.guests, { id, name: "", meal: "" }],
                        });
                      }}
                    >
                      Add a companion
                    </Button>
                    {party.guests.length >= SAMPLE_COMPANION_LIMIT && (
                      <p className="leading-relaxed">Both sample companion places are filled.</p>
                    )}
                  </div>
                </>
              )}
              {step === "review" && (
                <>
                  <p className="leading-relaxed">
                    {attending
                      ? "A place for everyone joining the celebration."
                      : "You chose: I'll be there in spirit."}
                  </p>
                  {attending && <PartySummary party={party} />}
                  <p className="leading-relaxed">
                    Continue to see the sample confirmation. Nothing will be sent.
                  </p>
                </>
              )}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button type="submit">
                  {step === "attendance"
                    ? "Continue"
                    : step === "party"
                      ? "Review your reply"
                      : "Preview confirmation"}
                </Button>
                {step !== "attendance" && (
                  <Button
                    variant="ghost"
                    onClick={() => go(step === "review" && attending ? "party" : "attendance")}
                  >
                    Back
                  </Button>
                )}
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function PartySummary({ party }: { party: PartyDraft }) {
  return (
    <ul aria-label="Party and meals" className="space-y-6">
      {[{ id: "primary", name: party.name, meal: party.meal }, ...party.guests].map((person) => (
        <li key={person.id} className="border-b border-border pb-6">
          <div className="font-display text-3xl leading-tight wrap-anywhere">{person.name}</div>
          <p className="mt-2 leading-relaxed">{mealLabel(person.meal)}</p>
        </li>
      ))}
    </ul>
  );
}
