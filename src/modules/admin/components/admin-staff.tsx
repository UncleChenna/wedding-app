import { db } from "@/modules/shared/server/db/client";
import { getEventSettings } from "@/modules/shared/server/settings";
import { STAFF_ROLE_OPTIONS, staffCopy } from "../lib/staff";
import { formatStaffExpiry } from "../lib/staff-time";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { listStaff } from "../server/staff-repository";
import { AddStaffForm } from "./add-staff-form";
import { StaffMemberActions } from "./staff-member-actions";

/** ADM-4: staff PINs for the gate, kitchen and bar (TICKET-096). */
export async function AdminStaff() {
  await requireAdminPageAccess();
  const [members, settings] = await Promise.all([listStaff(db), getEventSettings()]);
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">{staffCopy.heading}</h1>
      <p className="mt-6 max-w-prose">{staffCopy.intro}</p>
      {members.length === 0 && <p className="mt-12">{staffCopy.empty}</p>}
      {STAFF_ROLE_OPTIONS.map((role) => {
        const group = members.filter((member) => member.role === role.value);
        if (!group.length) return null;
        return (
          <section key={role.value} aria-labelledby={`staff-${role.value}`} className="mt-12">
            <h2 id={`staff-${role.value}`} className="type-label text-primary">
              {role.label}
            </h2>
            <ul className="mt-6 space-y-8">
              {group.map((member) => {
                const active = member.pinActive;
                return (
                  <li key={member.id} className="border-b border-border pb-8">
                    <h3 className="font-display text-2xl leading-snug">{member.name}</h3>
                    {/* PIN state in words, never colour alone. */}
                    <p className="mt-2 text-muted-foreground">
                      {member.revoked
                        ? staffCopy.revoked
                        : active && member.pinExpiresAt
                          ? staffCopy.activeUntil(
                              formatStaffExpiry(member.pinExpiresAt, settings.timeZone),
                            )
                          : staffCopy.noPin}
                    </p>
                    <div className="mt-4">
                      <StaffMemberActions id={member.id} name={member.name} hasPin={active} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <section aria-labelledby="staff-add" className="mt-16">
        <h2 id="staff-add" className="font-display text-3xl leading-tight">
          {staffCopy.add}
        </h2>
        <div className="mt-6">
          <AddStaffForm />
        </div>
      </section>
    </main>
  );
}
