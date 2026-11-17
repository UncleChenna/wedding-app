"use client";
import { useActionFeedback } from "@/modules/shared/components/use-action-feedback";
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
  useActionFeedback(state);
  const [deleted, deleteAction, deleting] = useActionState(deleteInvitationDraftAction, {
    status: "idle",
  });
  useActionFeedback(deleted);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const fields = state.status === "error" ? (state.fields ?? {}) : {};
  useEffect(() => {
    if (state.status === "error")
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  useEffect(() => {
    if (deleted.status === "deleted" || (!invitation && state.status === "saved"))
      confirmation.current?.focus();
  }, [deleted.status, invitation, state.status]);
  if (deleted.status === "deleted" || (!invitation && state.status === "saved"))
    return (
      <div className="mt-8 space-y-6">
        <p ref={confirmation} role="status" tabIndex={-1}>
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
  function renderGuest(member: InvitationEditorValues["members"][number], index: number) {
    return (
      <fieldset
        key={member.id || `new-${index}`}
        disabled={pending}
        className="space-y-6 border-t border-border pt-6"
      >
        <legend className="px-1 text-lg font-medium">
          {index === 0 ? "Guest details" : `Plus one ${index}`}
        </legend>
        <input type="hidden" name="memberId" value={member.id} />
        <Input
          label={index === 0 ? "Guest name" : `Plus one ${index} name`}
          name="memberName"
          value={member.name}
          onChange={(event) => updateMember(index, "name", event.target.value)}
          required
          maxLength={200}
          error={fields[`members.${index}.name`]}
        />
        <Input
          label={index === 0 ? "Guest email" : `Plus one ${index} email`}
          name="memberEmail"
          type="email"
          value={member.email}
          onChange={(event) => updateMember(index, "email", event.target.value)}
          maxLength={254}
          autoComplete="email"
          error={fields[`members.${index}.email`]}
        />
        <Input
          label={index === 0 ? "Guest phone" : `Plus one ${index} phone`}
          name="memberPhone"
          type="tel"
          value={member.phone}
          onChange={(event) => updateMember(index, "phone", event.target.value)}
          maxLength={200}
          autoComplete="tel"
          hint="Include the country code for numbers outside the UK."
          error={fields[`members.${index}.phone`]}
        />
        {index > 0 && (
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
            Remove plus one {index}
          </Button>
        )}
      </fieldset>
    );
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
        {values.members[0] && renderGuest(values.members[0], 0)}
        <fieldset disabled={pending} className="space-y-6">
          <legend className="mb-6 font-display text-2xl">Invitation details</legend>
          <input type="hidden" name="side" value={values.side} />
          <Select
            label="Table"
            name="tableId"
            value={values.tableId}
            onChange={(event) => setValues({ ...values, tableId: event.target.value })}
            hint="Multiple guests and their plus-ones can share a table. Each person counts toward its capacity."
            error={fields.tableId}
          >
            <option value="">Not seated yet</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                Table {table.number}
              </option>
            ))}
          </Select>
          <input type="hidden" name="maxTagAlongs" value={values.maxTagAlongs} />
        </fieldset>
        <section aria-labelledby="plus-one" className="space-y-6">
          <h2 id="plus-one" className="font-display text-2xl">
            Plus one
          </h2>
          {invitation?.reply && (
            <p className="max-w-prose">
              {invitation.reply.attending
                ? `This party replied yes for ${invitation.reply.countAttending}. Saving a changed guest list updates that party size, keeps their yes reply and records the correction. It cannot be smaller than the number already admitted.`
                : "This party replied no. Their answer stays unchanged when you edit their details."}
            </p>
          )}
          <p className="max-w-prose">
            Add anyone accompanying this guest. They share the invitation and table. Meal choices
            and dietary notes stay with each person; removing a plus-one keeps saved reply history.
          </p>
          {values.members.slice(1).map((member, index) => renderGuest(member, index + 1))}
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
            Add a plus-one
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
              name={values.members
                .map((member) => member.name)
                .filter(Boolean)
                .join(" & ")}
              status={invitation.status}
              tokenVersion={invitation.tokenVersion}
            />
          )}
        </section>
      )}
    </div>
  );
}
