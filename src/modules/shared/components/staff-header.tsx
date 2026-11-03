"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes, routeList } from "../lib/routes";

export function StaffHeader() {
  const path = usePathname();
  const station = routeList.find((route) => route.path === path && route.audience === "staff");
  return (
    <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-6 px-6 py-6 text-lg leading-relaxed">
      <Link
        href={appRoutes.staff.path}
        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        aria-current={path === appRoutes.staff.path ? "page" : undefined}
      >
        Staff home
      </Link>
      {station && path !== appRoutes.staff.path && <p>{station.label}</p>}
    </header>
  );
}
