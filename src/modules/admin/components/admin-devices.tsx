import { STAFF_ROLE_OPTIONS } from "../lib/staff";
import { deviceCopy } from "../lib/device";
import type { AdminDevice } from "../server/device-repository";
import { DeviceRenameForm } from "./device-rename-form";

const roleLabel = Object.fromEntries(STAFF_ROLE_OPTIONS.map((o) => [o.value, o.label]));

/** Registered scanner and board devices, each renameable (TICKET-064). Access is checked by the page. */
export function AdminDevices({ devices }: { devices: AdminDevice[] }) {
  return (
    <section aria-labelledby="staff-devices" className="mt-16">
      <h2 id="staff-devices" className="font-display text-3xl leading-tight">
        {deviceCopy.heading}
      </h2>
      <p className="mt-6 max-w-prose">{deviceCopy.intro}</p>
      {devices.length === 0 ? (
        <p className="mt-8">{deviceCopy.empty}</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {devices.map((device) => (
            <li key={device.id} className="border-b border-border pb-8">
              <h3 className="font-display text-2xl leading-snug">{device.name}</h3>
              <p className="mt-2 text-muted-foreground">
                {[
                  roleLabel[device.role],
                  deviceCopy.firstSignedIn(device.registeredBy),
                  device.revoked ? deviceCopy.removed : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-4">
                <DeviceRenameForm id={device.id} name={device.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
