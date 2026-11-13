"use client";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Input, Select, Textarea } from "@/modules/shared/components/ui";
import { settingsCopy, type SettingsField, type SettingsFormState } from "../lib/settings-form";
import { saveSettingsAction } from "../server/settings-actions";

export type SettingsDefaults = Record<SettingsField, string>;

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6 border-b border-border pb-12">
      <legend className="type-label text-primary">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Every event setting in one form; React resets it after saving, so it shows what was typed on errors. */
export function SettingsForm({ defaults }: { defaults: SettingsDefaults }) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(saveSettingsAction, {
    status: "idle",
  });
  const form = useRef<HTMLFormElement>(null);
  const errors = state.status === "error" ? (state.fields ?? {}) : {};
  const typed = state.status === "error" ? (state.values ?? {}) : {};
  const value = (name: SettingsField) => typed[name] ?? defaults[name];
  // Selects keep their value across the reset only when controlled.
  const [voice, setVoice] = useState(defaults.invitationVoice);
  useEffect(() => {
    if (state.status === "error")
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  const field = (name: SettingsField) => ({
    id: `settings-${name}`,
    name,
    defaultValue: value(name),
    error: errors[name],
  });
  return (
    <form ref={form} action={action} noValidate className="mt-12 space-y-12 [&_label]:text-base">
      <Group title="The couple">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input {...field("partnerOne")} label="First name" maxLength={200} required />
          <Input {...field("partnerTwo")} label="Second name" maxLength={200} required />
        </div>
      </Group>
      <Group title="The day">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input {...field("eventDate")} label="Wedding date" type="date" required />
          <Input
            {...field("ceremonyTime")}
            label="Ceremony time"
            type="time"
            hint="Optional until decided."
          />
        </div>
        <Input
          {...field("timeZone")}
          label="Venue time zone"
          hint="For example Africa/Lagos or Europe/London. Replies open once this is set."
          autoComplete="off"
          spellCheck={false}
        />
        <Input {...field("venue")} label="Venue" maxLength={500} hint="Optional until decided." />
        <Input
          {...field("mapUrl")}
          label="Map link"
          type="url"
          inputMode="url"
          hint="A full https:// link to the venue on a map."
        />
        <Textarea
          {...field("dressCode")}
          label="Dress code"
          rows={2}
          maxLength={500}
          hint="Optional."
        />
      </Group>
      <Group title="Replies">
        <Input
          {...field("rsvpLockAt")}
          label="RSVP cutoff"
          type="datetime-local"
          hint="Venue time. Optional: replies lock at midnight on the wedding day either way."
        />
        <Select
          id="settings-invitationVoice"
          name="invitationVoice"
          label="Invitation voice"
          value={voice}
          onChange={(event) => setVoice(event.target.value)}
          error={errors.invitationVoice}
        >
          <option value="warm">Warm</option>
          <option value="playful">Playful</option>
          <option value="formal">Formal</option>
        </Select>
        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            {...field("defaultMaxTagAlongs")}
            label="Extra guests per invitation"
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            hint="The usual number of plus-ones."
          />
          <Input
            {...field("retentionDays")}
            label="Keep guest data for (days)"
            type="number"
            inputMode="numeric"
            min={1}
            max={3650}
          />
        </div>
      </Group>
      <Group title="Table ordering">
        <p className="max-w-prose text-lg leading-relaxed">
          Open or close ordering from the control room. These limits apply while it&apos;s open.
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          <Input
            {...field("maxOpenOrdersPerTable")}
            label="Open orders per table"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
          />
          <Input
            {...field("orderCooldownSeconds")}
            label="Wait between orders (seconds)"
            type="number"
            inputMode="numeric"
            min={0}
            max={86400}
          />
          <Input
            {...field("maxItemQuantity")}
            label="Most of one item"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            {...field("wifiName")}
            label="Wi-Fi name"
            maxLength={32}
            autoComplete="off"
            spellCheck={false}
            hint="Printed on every table card. Optional until the router is set up."
          />
          <Input
            {...field("wifiPassword")}
            label="Wi-Fi password"
            maxLength={63}
            autoComplete="off"
            spellCheck={false}
            hint="Printed on every table card, so use the guest network's password."
          />
        </div>
      </Group>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          {pending ? settingsCopy.saving : settingsCopy.save}
        </Button>
        <p role="status" className="text-lg leading-relaxed">
          {state.status === "idle" ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
