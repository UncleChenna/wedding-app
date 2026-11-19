"use client";
import { useFeedbackMessage } from "@/modules/shared/components/use-action-feedback";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input, Select } from "@/modules/shared/components/ui";
import {
  filterGuestList,
  guestListStatuses,
  type GuestListFilters,
  type GuestListInvitation,
  type GuestListStatus,
} from "../lib/guest-list";
import { undoShareAction } from "../server/share-tracking-actions";
import { ShareMenu } from "./share-menu";
import { InvitationLifecycleControls } from "./invitation-lifecycle-controls";
import { guestExportSearch } from "../lib/guest-export-query";

const labels: Record<GuestListStatus, string> = {
  draft: "Draft",
  sent: "Awaiting reply",
  rsvp_yes: "Coming",
  rsvp_no: "Not coming",
  revoked: "Withdrawn",
};
const selectedValue = (value: string | null | undefined) =>
  value === undefined ? "" : value === null ? "none" : `value:${value}`;
const filterValue = (value: string) =>
  value === "" ? undefined : value === "none" ? null : value.slice(6);

export function GuestList({ invitations }: { invitations: GuestListInvitation[] }) {
  const [undoRecord, setUndoRecord] = useState<{
    invitationId: string;
    eventId: string;
    tokenVersion: number;
  } | null>(null);
  const [undoMessage, setUndoMessage] = useState("");
  const [undoPending, setUndoPending] = useState(false);
  useFeedbackMessage(undoPending ? "" : undoMessage);
  const currentUndo =
    undoRecord &&
    invitations.some(
      (row) =>
        row.id === undoRecord.invitationId &&
        row.tokenVersion === undoRecord.tokenVersion &&
        row.status !== "revoked",
    )
      ? undoRecord
      : null;
  async function undoShare() {
    if (!currentUndo) return;
    setUndoPending(true);
    try {
      const result = await undoShareAction({
        invitationId: currentUndo.invitationId,
        eventId: currentUndo.eventId,
      });
      setUndoMessage(
        result.ok
          ? "Sharing record undone. Messages already sent are not recalled."
          : result.message,
      );
      if (result.ok) {
        setUndoRecord(null);
        resultCount.current?.focus();
      }
    } catch {
      setUndoMessage("The sharing record couldn't be undone. Please try again.");
    } finally {
      setUndoPending(false);
    }
  }
  const [filters, setFilters] = useState<GuestListFilters>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = useMemo(() => filterGuestList(invitations, filters), [invitations, filters]);
  const resultCount = useRef<HTMLParagraphElement>(null);
  const wasExpandedVisible = useRef(false);
  const expandedVisible = visible.some((row) => row.id === expanded);
  useEffect(() => {
    // A successful revoke can remove its row from the current status filter.
    // Restore lost focus, but never steal it from someone typing in a filter.
    if (
      wasExpandedVisible.current &&
      !expandedVisible &&
      document.activeElement === document.body
    ) {
      resultCount.current?.focus();
    }
    wasExpandedVisible.current = expandedVisible;
  }, [expandedVisible]);
  const tables = useMemo(
    () =>
      [
        ...new Map(
          invitations.flatMap((row) =>
            row.tableId === null ? [] : [[row.tableId, row.tableNumber] as const],
          ),
        ).entries(),
      ].sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0)),
    [invitations],
  );
  return (
    <>
      <dl className="mb-6 grid grid-cols-3 gap-3 border-y border-border py-5">
        <div>
          <dt className="text-sm text-muted-foreground">Invitations</dt>
          <dd className="mt-1 font-display text-3xl">{invitations.length}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Guests coming</dt>
          <dd className="mt-1 font-display text-3xl">
            {invitations.reduce(
              (total, row) => total + (row.status === "rsvp_yes" ? (row.countAttending ?? 0) : 0),
              0,
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Awaiting reply</dt>
          <dd className="mt-1 font-display text-3xl">
            {invitations.filter((row) => row.status === "sent").length}
          </dd>
        </div>
      </dl>
      <form
        className="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-6 [&_label]:text-sm"
        role="search"
        aria-label="Find invitations"
        onSubmit={(event) => event.preventDefault()}
      >
        <Input
          label="Search guests"
          type="search"
          autoComplete="off"
          className="text-base"
          placeholder="Guest name"
          value={filters.query ?? ""}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
        />
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-primary">
            Filter invitations
          </summary>
          <div className="grid gap-4 sm:grid-cols-3 [&>div]:min-w-0">
            <Select
              label="Invitation status"
              className="text-base"
              value={filters.status ?? ""}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  status: guestListStatuses.find((value) => value === event.target.value),
                })
              }
            >
              <option value="">All statuses</option>
              {guestListStatuses.map((status) => (
                <option key={status} value={status}>
                  {labels[status]}
                </option>
              ))}
            </Select>
            <Select
              label="Sent"
              className="text-base"
              value={filters.sent ?? ""}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  sent:
                    event.target.value === "sent"
                      ? "sent"
                      : event.target.value === "unsent"
                        ? "unsent"
                        : undefined,
                })
              }
            >
              <option value="">Sent and unsent</option>
              <option value="sent">Sent</option>
              <option value="unsent">Not sent yet</option>
            </Select>

            <Select
              label="Table"
              className="text-base"
              value={selectedValue(filters.tableId)}
              onChange={(event) =>
                setFilters({ ...filters, tableId: filterValue(event.target.value) })
              }
            >
              <option value="">All tables</option>
              <option value="none">Not seated yet</option>
              {tables.map(([id, number]) => (
                <option key={id} value={`value:${id}`}>
                  Table {number}
                </option>
              ))}
            </Select>
          </div>
        </details>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p
            ref={resultCount}
            tabIndex={-1}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {visible.length} of {invitations.length} invitations
          </p>
          <Button variant="ghost" size="lg" onClick={() => setFilters({})}>
            Clear filters
          </Button>
        </div>
      </form>
      <a
        href={`/admin/guests/export?${guestExportSearch(filters)}`}
        download
        className="mt-3 inline-flex min-h-11 min-w-11 items-center rounded-md px-1 py-2 text-sm font-medium text-primary hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Download filtered guest list (CSV)
      </a>
      {(currentUndo || undoMessage) && (
        <div className="mt-6 space-y-3">
          <p role="status">
            {undoMessage || "Sharing attempt recorded. This does not confirm delivery."}
          </p>
          {currentUndo && (
            <Button size="lg" variant="secondary" onClick={undoShare} disabled={undoPending}>
              Undo sharing record
            </Button>
          )}
        </div>
      )}
      {visible.length === 0 ? (
        <p className="mt-12 max-w-prose">
          {invitations.length
            ? "No invitations match. Try another name or clear your filters."
            : "Your guest list is empty. Invitations will appear here once guests are added."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border" aria-label="Invitations">
          {visible.map((invitation) => (
            <li key={invitation.id} className="py-5" data-invitation-id={invitation.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="min-w-0 font-display text-2xl wrap-anywhere">{invitation.name}</h2>
                <p
                  className={
                    invitation.status === "revoked"
                      ? "text-danger"
                      : invitation.status === "rsvp_yes"
                        ? "text-success"
                        : "text-muted-foreground"
                  }
                >
                  {labels[invitation.status]}
                </p>
              </div>
              {invitation.guests.length > 1 && (
                <p className="mt-2 text-sm wrap-anywhere text-muted-foreground">
                  {invitation.guests.length} guests on this invitation
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {invitation.guests.length} named ·{" "}
                {invitation.countAttending === null
                  ? "No reply yet"
                  : `${invitation.countAttending} in saved reply`}{" "}
                · {invitation.sentAt ? "Sent" : "Not sent yet"}
              </p>
              <p className="mt-2 text-sm wrap-anywhere text-muted-foreground">
                {invitation.tableNumber === null
                  ? "Not seated yet"
                  : `Table ${invitation.tableNumber}`}{" "}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Link
                  href={`/admin/guests/${invitation.id}/edit`}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
                >
                  Edit guest
                </Link>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-sm"
                  aria-label={`Invitation actions for ${invitation.name}`}
                  aria-expanded={expanded === invitation.id}
                  aria-controls={`actions-${invitation.id}`}
                  onClick={() => setExpanded(expanded === invitation.id ? null : invitation.id)}
                >
                  Invitation actions
                </Button>
              </div>
              <div
                id={`actions-${invitation.id}`}
                className="mt-6 space-y-6"
                hidden={expanded !== invitation.id}
              >
                <Link
                  href={`/admin/guests/${invitation.id}/edit`}
                  className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                  aria-label={`Edit invitation for ${invitation.name}`}
                >
                  Edit details
                </Link>
                <Link
                  href={`/admin/guests/${invitation.id}/history`}
                  className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                  aria-label={`Reply history for ${invitation.name}`}
                >
                  Reply history
                </Link>
                {expanded === invitation.id ? (
                  <InvitationLifecycleControls
                    invitationId={invitation.id}
                    name={invitation.name}
                    status={invitation.status}
                    tokenVersion={invitation.tokenVersion}
                  />
                ) : null}
                {expanded === invitation.id ? (
                  invitation.share ? (
                    <ShareMenu
                      key={invitation.tokenVersion}
                      onRecorded={(eventId) => {
                        setUndoRecord({
                          invitationId: invitation.id,
                          eventId,
                          tokenVersion: invitation.tokenVersion,
                        });
                        setUndoMessage("");
                      }}
                      tracking={{
                        invitationId: invitation.id,
                        expectedVersion: invitation.tokenVersion,
                      }}
                      invitation={invitation.share}
                    />
                  ) : (
                    <p>{invitation.guidance}</p>
                  )
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
