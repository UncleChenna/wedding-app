import "server-only";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  TABLE_COOKIE,
  tableErrors,
  tableErrorSchema,
  type TableSearch,
} from "../lib/table-selection";
import { resolveTableSelection } from "../server/table-selection";
import { findTable } from "../server/table-repository";
import { getEventSettings } from "@/modules/shared/server/settings";
import { loadMenu } from "../server/menu";
import { listMenuItems } from "../server/menu-repository";
import { OrderMenu } from "./order-menu";
import { TableForm } from "./table-form";

async function OrderSelection({ searchParams }: { searchParams: TableSearch }) {
  const query = await searchParams;
  const change = query.change === "1";
  const error = tableErrorSchema.safeParse(query.error);
  const saved = (await cookies()).get(TABLE_COOKIE)?.value;
  const selected = saved ? await resolveTableSelection(saved, findTable) : null;
  if (!change && selected?.status === "selected")
    return (
      <>
        <section aria-labelledby="selected-table">
          <h2
            id="selected-table"
            tabIndex={-1}
            className="type-heading focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Table {selected.table.number}
          </h2>
          <p className="mt-6 text-lg leading-relaxed">Your table is set for this visit.</p>
          <Link
            href="/order?change=1"
            className="mt-8 inline-flex min-h-11 items-center py-2 text-base text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Change table
          </Link>
        </section>
        <OrderMenu
          menu={await loadMenu(listMenuItems)}
          table={selected.table.number}
          open={(await getEventSettings()).orderingOpen}
        />
      </>
    );
  const value =
    error.success && typeof query.table === "string"
      ? query.table.slice(0, 10)
      : selected?.status === "selected"
        ? String(selected.table.number)
        : "";
  const notice = error.success
    ? tableErrors[error.data]
    : selected && selected.status !== "selected"
      ? selected.message
      : undefined;
  return <TableForm key={`${value}:${notice ?? ""}`} value={value} notice={notice} />;
}

export function OrderEntry({ searchParams }: { searchParams: TableSearch }) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 pt-12 pb-[max(3rem,env(safe-area-inset-bottom))] md:pt-16">
      <p className="type-label text-primary">At your table</p>
      <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight text-balance md:text-5xl">
        Hungry? Thirsty? Say the word.
      </h1>
      <p className="mt-6 text-lg leading-relaxed">Tell us where you&apos;re sitting.</p>
      <div className="mt-12 min-h-96">
        <OrderSelection searchParams={searchParams} />
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center py-2 text-base text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Back to our day
      </Link>
    </main>
  );
}
