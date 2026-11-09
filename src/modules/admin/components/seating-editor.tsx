"use client";

import { useEffect, useRef, useState, useTransition, type TransitionStartFunction } from "react";
import { Button, Input, Select, Sheet } from "@/modules/shared/components/ui";
import {
  seatingOccupancy,
  seatingTableVersion,
  type SeatingPlan,
  type SeatingParty,
  type SeatingTable,
} from "../lib/seating";
import { assignTableAction, deleteTableAction, saveTableAction } from "../server/seating-actions";
import type { SeatingMutation } from "../server/seating-repository";

function TableForm({
  table,
  done,
  pending,
  start,
}: {
  table: SeatingTable | null;
  done: (message: string) => void;
  pending: boolean;
  start: TransitionStartFunction;
}) {
  const [result, setResult] = useState<SeatingMutation | null>(null);
  const [confirm, setConfirm] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const confirmationUsed = useRef(false);
  useEffect(() => {
    if (confirm) {
      confirmationUsed.current = true;
      form.current?.querySelector<HTMLButtonElement>("[data-confirm-delete]")?.focus();
    } else if (confirmationUsed.current)
      form.current?.querySelector<HTMLButtonElement>("[data-start-delete]")?.focus();
  }, [confirm]);
  const error = useRef<HTMLParagraphElement>(null);
  const fields = result && !result.ok ? result.fields : undefined;
  useEffect(() => {
    if (result && !result.ok) {
      const field = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      (field ?? error.current)?.focus();
    }
  }, [result]);
  const finish = (value: SeatingMutation) => (value.ok ? done(value.message) : setResult(value));
  return (
    <form
      ref={form}
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () =>
          finish(
            await saveTableAction({
              id: table?.id ?? null,
              expected: table ? seatingTableVersion(table) : null,
              values: {
                number: Number(data.get("number")),
                name: String(data.get("name") ?? ""),
                capacity: Number(data.get("capacity")),
              },
            }),
          ),
        );
      }}
    >
      <fieldset disabled={pending} className="space-y-6">
        <Input
          label="Table number"
          name="number"
          type="number"
          min={1}
          max={2147483647}
          required
          defaultValue={table?.number}
          error={fields?.number}
        />
        <Input
          label="Table name"
          name="name"
          maxLength={200}
          hint="Optional"
          defaultValue={table?.name ?? ""}
          error={fields?.name}
        />
        <Input
          label="Seats"
          name="capacity"
          type="number"
          min={1}
          max={2147483647}
          required
          defaultValue={table?.capacity ?? 8}
          error={fields?.capacity}
        />
        {result && !result.ok && (
          <p ref={error} tabIndex={-1} role="alert">
            {result.message}
          </p>
        )}
        <Button type="submit" loading={pending}>
          {table ? "Save table" : "Add table"}
        </Button>
        {table && (
          <div className="space-y-3 border-t border-border pt-6">
            <p className="text-base text-muted-foreground">
              Move or unassign households first. Tables with order history must be kept.
            </p>
            {confirm ? (
              <>
                <p>Delete table {table.number}?</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="danger"
                    data-confirm-delete
                    onClick={() =>
                      start(async () =>
                        finish(
                          await deleteTableAction({
                            id: table.id,
                            expected: seatingTableVersion(table),
                          }),
                        ),
                      )
                    }
                  >
                    Confirm delete
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirm(false)}>
                    Keep table
                  </Button>
                </div>
              </>
            ) : (
              <Button data-start-delete variant="ghost" onClick={() => setConfirm(true)}>
                Delete table
              </Button>
            )}
          </div>
        )}
      </fieldset>
    </form>
  );
}

function AssignmentForm({
  party,
  plan,
  done,
  pending,
  start,
}: {
  party: SeatingParty;
  plan: SeatingPlan;
  done: (message: string) => void;
  pending: boolean;
  start: TransitionStartFunction;
}) {
  const [target, setTarget] = useState(party.tableId ?? "");
  const [message, setMessage] = useState("");
  const error = useRef<HTMLParagraphElement>(null);
  const table = plan.tables.find((row) => row.id === target);
  const predicted = table
    ? seatingOccupancy(
        [...plan.parties.filter((row) => row.tableId === target && row.id !== party.id), party],
        table.capacity,
      )
    : null;
  useEffect(() => {
    if (message) error.current?.focus();
  }, [message]);
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await assignTableAction({
            invitationId: party.id,
            expectedTableId: party.tableId,
            tableId: target || null,
          });
          if (result.ok) done(result.message);
          else setMessage(result.message);
        });
      }}
    >
      <p className="break-words">{party.name}</p>
      <Select
        label="Table"
        value={target}
        disabled={pending}
        onChange={(event) => setTarget(event.target.value)}
      >
        <option value="">Unassigned</option>
        {plan.tables.map((row) => (
          <option key={row.id} value={row.id}>
            Table {row.number}
            {row.name ? ` · ${row.name}` : ""}
          </option>
        ))}
      </Select>
      {predicted && (
        <p role="status">
          {predicted.total} of {table?.capacity} seats, including {predicted.pending} named guests
          awaiting a reply.
          {predicted.overBy > 0
            ? ` This is ${predicted.overBy} over capacity. You can still save this assignment.`
            : ""}
        </p>
      )}
      {message && (
        <p role="alert" tabIndex={-1} ref={error}>
          {message}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Save assignment
      </Button>
    </form>
  );
}

export function SeatingEditor({ plan }: { plan: SeatingPlan }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<
    { kind: "table"; table: SeatingTable | null } | { kind: "party"; party: SeatingParty } | null
  >(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const result = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (notice && !editing) result.current?.focus();
  }, [notice, editing]);
  const open = (value: NonNullable<typeof editing>) => {
    setNotice("");
    setEditing(value);
  };
  const done = (message: string) => {
    setEditing(null);
    setNotice(message);
  };
  const visible = plan.parties.filter((party) =>
    party.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <div className="mt-12 space-y-12">
      {notice && (
        <p role="status" tabIndex={-1} ref={result}>
          {notice}
        </p>
      )}
      <section aria-labelledby="tables-heading" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="tables-heading" className="font-display text-3xl">
            Tables
          </h2>
          <Button onClick={() => open({ kind: "table", table: null })}>Add table</Button>
        </div>
        <p className="max-w-prose text-muted-foreground">
          Seat counts include confirmed replies and named guests awaiting a reply. Declined and
          revoked invitations do not take seats. Capacity warnings never prevent an assignment.
        </p>
        {plan.tables.length === 0 ? (
          <p>No tables yet. Add your first table to begin.</p>
        ) : (
          <ul className="divide-y divide-border">
            {plan.tables.map((table) => {
              const count = seatingOccupancy(
                plan.parties.filter((party) => party.tableId === table.id),
                table.capacity,
              );
              return (
                <li
                  key={table.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-6"
                >
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl break-words">
                      Table {table.number}
                      {table.name ? ` · ${table.name}` : ""}
                    </h3>
                    <p>
                      {count.total} / {table.capacity} seats · {count.confirmed} confirmed ·{" "}
                      {count.pending} awaiting reply
                    </p>
                    {count.overBy > 0 && (
                      <p className="font-medium">Over capacity by {count.overBy}</p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    aria-label={`Edit table ${table.number}`}
                    onClick={() => open({ kind: "table", table })}
                  >
                    Edit table
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section aria-labelledby="households-heading" className="space-y-6">
        <h2 id="households-heading" className="font-display text-3xl">
          Households
        </h2>
        <Input
          label="Find a household"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p aria-live="polite">
          {visible.length} household{visible.length === 1 ? "" : "s"}
        </p>
        <ul className="divide-y divide-border">
          {visible.map((party) => {
            const table = plan.tables.find((row) => row.id === party.tableId);
            const count = seatingOccupancy([party], Number.MAX_SAFE_INTEGER);
            return (
              <li key={party.id} className="flex flex-wrap items-center justify-between gap-4 py-6">
                <div className="min-w-0">
                  <h3 className="font-medium break-words">{party.name}</h3>
                  <p className="text-base text-muted-foreground">
                    {table ? `Table ${table.number}` : "Unassigned"} · {count.total} seat
                    {count.total === 1 ? "" : "s"}
                    {party.status === "revoked"
                      ? " · Revoked"
                      : party.status === "rsvp_no"
                        ? " · Not attending"
                        : party.countAttending === null
                          ? " · Awaiting reply"
                          : ""}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  aria-label={`Assign table for ${party.name}`}
                  onClick={() => open({ kind: "party", party })}
                >
                  Assign table
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
      <Sheet
        open={editing !== null}
        onOpenChange={(value) => {
          if (!value && !pending) setEditing(null);
        }}
        title={
          editing?.kind === "party"
            ? "Seat this household"
            : editing?.table
              ? `Edit table ${editing.table.number}`
              : "Add a table"
        }
        className="max-h-[90dvh] overflow-y-auto"
      >
        {editing?.kind === "table" && (
          <TableForm
            key={editing.table?.id ?? "new"}
            table={editing.table}
            done={done}
            pending={pending}
            start={start}
          />
        )}
        {editing?.kind === "party" && (
          <AssignmentForm
            key={editing.party.id}
            party={editing.party}
            plan={plan}
            done={done}
            pending={pending}
            start={start}
          />
        )}
      </Sheet>
    </div>
  );
}
