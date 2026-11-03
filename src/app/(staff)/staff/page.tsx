import type { Metadata } from "next";
import { StaffHub } from "@/modules/shared/components/staff-hub";
export const metadata: Metadata = { title: "Staff home", robots: { index: false } };
export default function StaffPage() {
  return <StaffHub />;
}
