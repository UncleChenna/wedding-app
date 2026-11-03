import type { Metadata } from "next";
import type { TableSearch } from "@/modules/ordering/lib/table-selection";
import { connection } from "next/server";
import { OrderEntry } from "@/modules/ordering/components/order-entry";

export const metadata: Metadata = { title: "Order to your table" };
// Render the session-dependent form as usable HTML without JavaScript.
export const instant = false;
export default async function OrderPage({ searchParams }: { searchParams: TableSearch }) {
  await connection();
  return <OrderEntry searchParams={searchParams} />;
}
