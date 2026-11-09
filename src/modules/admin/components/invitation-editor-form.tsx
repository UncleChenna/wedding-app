"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button, Input, Select, Sheet } from "@/modules/shared/components/ui";
import type {
  InvitationEditorDetails,
  InvitationEditorState,
  InvitationEditorValues,
} from "../lib/invitation-editor";
import {
  deleteInvitationDraftAction,
  saveInvitationEditorAction,
} from "../server/invitation-editor-actions";
import { InvitationLifecycleControls } from "./invitation-lifecycle-controls";

const empty: InvitationEditorValues = {
  householdName: "",
  side: "",
  tableId: "",
  maxTagAlongs: "1",
  members: [{ id: "", name: "", email: "", phone: "" }],
};
const linkStyle =
  "inline-flex min-h-11 items-center text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";
export function InvitationEditorForm({
  invitation,
  tables,
  saveAction = saveInvitationEditorAction,
}: {
  invitation?: InvitationEditorDetails;
  tables: { id: string; number: number }[];
  saveAction?: (previous: InvitationEditorState, form: FormData) => Promise<InvitationEditorState>;
}) {
  const [values, setValues] = useState<InvitationEditorValues>(invitation?.values ?? empty);
  // A refreshed RSC payload must not silently bless stale, unsaved local values.
  const [snapshot, setSnapshot] = useState(invitation?.snapshot ?? "");
  const [state, action, pending] = useActionState<InvitationEditorState, FormData>(
    async (previous, formData) => {
      const result = await saveAction(previous, formData);
      if (result.status === "saved") {
        setSnapshot(result.snapshot);
        setValues(result.values);
      }
      return result;
    },
    { status: "idle" },
  );
  const [deleted, deleteAction, deleting] = useActionState(deleteInvitationDraftAction, {
    status: "idle",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const fields = state.status === "error" ? (state.fields ?? {}) : {};
  useEffect(() => {
    if (state.status === "error")
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  if (deleted.status === "deleted" || (!invitation && state.status === "saved"))
    return (
      <div className="mt-8 space-y-6">
        <p role="status">
          {deleted.status === "deleted"
            ? deleted.message
            : state.status === "saved"
              ? state.message
              : ""}
        </p>
        {state.status === "saved" && (
          <Link className={linkStyle} href={`/admin/guests/${state.id}/edit`}>
            Edit this invitation
          </Link>
        )}
        <p>
          <Link className={linkStyle} href="/admin/guests">
            Back to guests
          </Link>
        </p>
      </div>
    );
  function updateMember(index: number, key: "name" | "email" | "phone", value: string) {
    setValues((current) => ({
      ...current,
      members: current.members.map((member, position) =>
        position === index ? { ...member, [key]: value } : member,
      ),
    }));
  }
  return (
    <div className="mt-8 space-y-12">
      <form ref={form} action={action} noValidate className="space-y-8 [&_label]:text-base">
        {invitation && (
          <>
            <input type="hidden" name="id" value={invitation.id} />
            <input type="hidden" name="snapshot" value={snapshot} />
          </>
        )}
        <fieldset disabled={pending} className="space-y-6">
          <legend className="mb-6 font-display text-2xl">Household details</legend>
          <Input
            label="Household name"
            name="householdName"
            value={values.householdName}
            onChange={(event) => setValues({ ...values, householdName: event.target.value })}
            required
            maxLength={200}
            error={fields.householdName}
          />
          <Input
            label="Side"
            name="side"
            value={values.side}
            onChange={(event) => setValues({ ...values, side: event.target.value })}
            maxLength={200}
            hint="Optional, for example bride's family or groom's friends."
            error={fields.side}
          />
          <Select
            label="Table"
            name="tableId"
            value={values.tableId}
            onChange={(event) => setValues({ ...values, tableId: event.target.value })}
            hint="Changing the household table seats all its named guests together."
            error={fields.tableId}
          >
            <option value="">Not seated yet</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                Table {table.number}
              </option>
            ))}
          </Select>
          <Input
            label="Additional tag-along places"
            name="maxTagAlongs"
            type="number"
            min={0}
            max={10}
            value={values.maxTagAlongs}
            onChange={(event) => setValues({ ...values, maxTagAlongs: event.target.value })}
            hint="Extra people this household may name when replying, in addition to the named invitees."
            error={fields.maxTagAlongs}
          />
        </fieldset>
        <section aria-labelledby="named-guests" className="space-y-6">
          <h2 id="named-guests" className="font-display text-2xl">
            Named guests
          </h2>
          {invitation?.reply && (
            <p className="max-w-prose">
              {invitation.reply.attending
                ? `This household replied yes for ${invitation.reply.countAttending}. Saving a changed guest list updates that party size, keeps their yes reply and records the correction. It cannot be smaller than the number already admitted.`
                : "This household replied no. Their answer stays unchanged when you edit their details."}
            </p>
          )}
          <p className="max-w-prose">
            Existing meal choices and dietary notes stay with each guest. Removing a guest removes
            their current details; saved reply history stays on record.
          </p>
          {values.members.map((member, index) => (
            <fieldset
              key={member.id || `new-${index}`}
              disabled={pending}
              className="space-y-6 border-t border-border pt-6"
            >
              <legend className="px-1 text-lg font-medium">Guest {index + 1}</legend>
              <input type="hidden" name="memberId" value={member.id} />
              <Input
                label={`Guest ${index + 1} name`}
                name="memberName"
                value={member.name}
                onChange={(event) => updateMember(index, "name", event.target.value)}
                required
                maxLength={200}
                error={fields[`members.${index}.name`]}
              />
              <Input
                label={`Guest ${index + 1} email`}
                name="memberEmail"
                type="email"
                value={member.email}
                onChange={(event) => updateMember(index, "email", event.target.value)}
                maxLength={254}
                autoComplete="email"
                error={fields[`members.${index}.email`]}
              />
              <Input
                label={`Guest ${index + 1} phone`}
                name="memberPhone"
                type="tel"
                value={member.phone}
                onChange={(event) => updateMember(index, "phone", event.target.value)}
                maxLength={200}
                autoComplete="tel"
                hint="Include the country code for numbers outside the UK."
                error={fields[`members.${index}.phone`]}
              />
              <Button
                type="button"
                variant="ghost"
                disabled={pending || values.members.length === 1}
                onClick={() =>
                  setValues({
                    ...values,
                    members: values.members.filter((_, position) => position !== index),
                  })
                }
              >
                Remove guest {index + 1}
              </Button>
            </fieldset>
          ))}
          {fields.members && <p role="alert">{fields.members}</p>}
          <Button
            type="button"
            variant="secondary"
            disabled={pending || values.members.length >= 300}
            onClick={() =>
              setValues({
                ...values,
                members: [...values.members, { id: "", name: "", phone: "", email: "" }],
              })
            }
          >
            Add a named guest
          </Button>
        </section>
        {state.status !== "idle" && (
          <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : invitation ? "Save invitation" : "Create draft invitation"}
        </Button>
      </form>
      {invitation && (
        <section className="space-y-6" aria-label="Invitation status actions">
          <h2 className="font-display text-2xl">Invitation status</h2>
          {invitation.status === "draft" ? (
            <>
              <p>
                Only an untouched draft can be permanently deleted. Invitations with replies or
                history must be withdrawn instead.
              </p>
              <Button
                variant="ghost"
                disabled={pending || deleting}
                onClick={() => setConfirmDelete(true)}
              >
                Delete draft
              </Button>
              <Sheet
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Delete this draft?"
              >
                <p>This removes the draft and its named guests. It cannot be undone.</p>
                <form action={deleteAction} className="space-y-6">
                  <input type="hidden" name="id" value={invitation.id} />
                  <input type="hidden" name="snapshot" value={snapshot} />
                  <input type="hidden" name="confirmation" value="delete" />
                  {deleted.status === "error" && <p role="alert">{deleted.message}</p>}
                  <Button type="submit" disabled={deleting}>
                    {deleting ? "Deleting…" : "Delete draft permanently"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Keep draft
                  </Button>
                </form>
              </Sheet>
            </>
          ) : (
            <InvitationLifecycleControls
              invitationId={invitation.id}
              name={values.householdName}
              status={invitation.status}
              tokenVersion={invitation.tokenVersion}
            />
          )}
        </section>
      )}
    </div>
  );
}
