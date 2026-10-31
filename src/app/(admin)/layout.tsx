/** Shared shell for admin and sign-in pages; protected content also checks access before rendering. */
export default function AdminLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
