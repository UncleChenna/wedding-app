import { db } from "@/modules/shared/server/db/client";
import { getEventSettings } from "@/modules/shared/server/settings";
import { STAFF_ROLE_OPTIONS, hostTablesCopy, staffCopy } from "../lib/staff";
import { formatStaffExpiry } from "../lib/staff-time";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { listStaff } from "../server/staff-repository";
import { listDevices } from "../server/device-repository";
import { AddStaffForm } from "./add-staff-form";
import { AdminDevices } from "./admin-devices";
import { StaffMemberActions } from "./staff-member-actions";
import { StaffAlertForm } from "./staff-alert-form";
import { HostTablesForm } from "./host-tables-form";
import { alertCopy } from "../lib/staff-alerts";

/** ADM-4: staff PINs for the gate, kitchen, bar and table hosts (TICKET-096, TICKET-082). */
export async function AdminStaff() {
  await requireAdminPageAccess();
  const [members, settings, devices] = await Promise.all([
    listStaff(db),
    getEventSettings(),
    listDevices(db),
  ]);
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
                    {member.role === "host" && (
                      <p className="mt-1 text-muted-foreground">
                        {member.hostTables.length
                          ? hostTablesCopy.list(member.hostTables)
                          : hostTablesCopy.none}
                      </p>
                    )}
                    {(member.role === "kitchen" || member.role === "bar") && (
                      <p className="mt-1 text-muted-foreground">
                        {member.alertsOptIn && member.whatsappNumber
                          ? alertCopy.on(member.whatsappNumber)
                          : alertCopy.off}
                      </p>
                    )}
                    <div className="mt-4">
                      <StaffMemberActions id={member.id} name={member.name} hasPin={active} />
                    </div>
                    {member.role === "host" && !member.revoked && (
                      <div className="mt-6">
                        <HostTablesForm
                          id={member.id}
                          name={member.name}
                          tables={member.hostTables}
                        />
                      </div>
                    )}
                    {(member.role === "kitchen" || member.role === "bar") && !member.revoked && (
                      <div className="mt-6">
                        <StaffAlertForm
                          id={member.id}
                          name={member.name}
                          number={member.whatsappNumber}
                          optIn={member.alertsOptIn}
                        />
                      </div>
                    )}
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
      <AdminDevices devices={devices} />
    </main>
  );
}
