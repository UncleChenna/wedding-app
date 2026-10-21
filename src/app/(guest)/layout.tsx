/** Layout for guest-facing pages (invitation, RSVP, table ordering). */
export default function GuestLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
