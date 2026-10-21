/** Layout for the admin area. Admin auth guard goes here. */
export default function AdminLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
