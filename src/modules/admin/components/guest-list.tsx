"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Select } from "@/modules/shared/components/ui";
import {
  filterGuestList,
  guestListStatuses,
  type GuestListFilters,
  type GuestListInvitation,
  type GuestListStatus,
} from "../lib/guest-list";
import { ShareMenu } from "./share-menu";
import { InvitationLifecycleControls } from "./invitation-lifecycle-controls";

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
  const sides = useMemo(
    () => [...new Set(invitations.flatMap((row) => (row.side === null ? [] : [row.side])))].sort(),
    [invitations],
  );
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
      <form
        className="mt-8 space-y-6 [&_label]:text-lg"
        role="search"
        aria-label="Find invitations"
        onSubmit={(event) => event.preventDefault()}
      >
        <Input
          label="Search guests"
          type="search"
          autoComplete="off"
          className="text-lg"
          placeholder="Household or guest name"
          value={filters.query ?? ""}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 [&>div]:min-w-0">
          <Select
            label="Invitation status"
            className="text-lg"
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
            className="text-lg"
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
            label="Side"
            className="text-lg"
            value={selectedValue(filters.side)}
            onChange={(event) => setFilters({ ...filters, side: filterValue(event.target.value) })}
          >
            <option value="">All sides</option>
            <option value="none">Not assigned</option>
            {sides.map((side) => (
              <option key={side} value={`value:${side}`}>
                {side}
              </option>
            ))}
          </Select>
          <Select
            label="Table"
            className="text-lg"
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
      {visible.length === 0 ? (
        <p className="mt-12 max-w-prose">
          {invitations.length
            ? "No invitations match. Try another name or clear your filters."
            : "Your guest list is empty. Invitations will appear here once guests are added."}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border" aria-label="Invitations">
          {visible.map((invitation) => (
            <li key={invitation.id} className="py-6 first:pt-0" data-invitation-id={invitation.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="min-w-0 font-display text-3xl wrap-anywhere">{invitation.name}</h2>
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
              <p className="mt-3 wrap-anywhere">
                {invitation.guests.map((guest) => guest.name).join(" · ") || "No named guests yet"}
              </p>
              <p className="mt-3 text-muted-foreground">
                {invitation.guests.length} named ·{" "}
                {invitation.countAttending === null
                  ? "No reply yet"
                  : `${invitation.countAttending} in saved reply`}{" "}
                · {invitation.sentAt ? "Sent" : "Not sent yet"}
              </p>
              <p className="mt-2 wrap-anywhere text-muted-foreground">
                {invitation.tableNumber === null
                  ? "Not seated yet"
                  : `Table ${invitation.tableNumber}`}{" "}
                · {invitation.side ?? "Side not assigned"}
              </p>
              <Button
                variant="ghost"
                size="lg"
                className="mt-3"
                aria-label={`Invitation actions for ${invitation.name}`}
                aria-expanded={expanded === invitation.id}
                aria-controls={`actions-${invitation.id}`}
                onClick={() => setExpanded(expanded === invitation.id ? null : invitation.id)}
              >
                Invitation actions
              </Button>
              <div
                id={`actions-${invitation.id}`}
                className="mt-6 space-y-6"
                hidden={expanded !== invitation.id}
              >
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
                      key={`${invitation.tokenVersion}:${invitation.status}`}
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
