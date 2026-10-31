import Link from "next/link";
import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";
import { requireAdminPageAccess } from "../server/current-admin-access";

export async function AdminDashboard() {
  await requireAdminPageAccess();
  return (
    <>
      <PagePlaceholder
        eyebrow="Admin"
        title="Wedding control room"
        description="Guest list, seating, menu and the live dashboard. Coming soon."
      />
      <nav aria-label="Admin account" className="mx-auto flex gap-6 px-6 pb-8">
        <Link
          className="inline-flex min-h-11 items-center text-lg text-primary underline"
          href="/admin/sign-in"
        >
          Sign in
        </Link>
        <Link
          className="inline-flex min-h-11 items-center text-lg text-primary underline"
          href="/admin/sign-out"
        >
          Sign out
        </Link>
      </nav>
    </>
  );
}
