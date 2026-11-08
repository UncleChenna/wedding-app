import { appRoutes } from "@/modules/shared/lib/routes";
import { AdminShell } from "./admin-shell";

/** Sample-data preview of the admin shell for `/dev/admin`; no sign-in, no guest data. */
export function AdminShellPreview() {
  return (
    <AdminShell eventName="Uchenna & Adaora" currentPath={appRoutes.admin.path}>
      <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
        <p className="type-label text-primary">Preview</p>
        <h1 className="mt-6 font-display text-4xl leading-tight md:text-5xl">
          Wedding control room
        </h1>
        <p className="mt-6 max-w-prose">
          Sample layout only. The real control room asks you to sign in and shows your own event.
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {["Sharing", "Guests", "Seating", "Menu", "Staff", "Settings"].map((name) => (
            <li key={name}>
              <h2 className="font-display text-3xl">{name}</h2>
              <p className="mt-3 text-muted-foreground">A section of the control room.</p>
            </li>
          ))}
        </ul>
      </main>
    </AdminShell>
  );
}
