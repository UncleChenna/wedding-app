export type RouteAudience = "guest" | "staff" | "admin" | "dev";
export type RouteAccess = "public" | "invitation" | "pass" | "session" | "admin" | "preview";

export interface AppRoute {
  readonly path: `/${string}`;
  readonly label: string;
  readonly audience: RouteAudience;
  readonly access: RouteAccess;
}

/** Navigation metadata is not authorization; server readers still enforce access. */
export const appRoutes = {
  adminReminders: {
    path: "/admin/sharing/reminders",
    label: "Reminders",
    audience: "admin",
    access: "admin",
  },
  home: { path: "/", label: "Our day", audience: "guest", access: "public" },
  invite: { path: "/invite", label: "Your invitation", audience: "guest", access: "public" },
  invitation: {
    path: "/i/[token]",
    label: "Your invitation",
    audience: "guest",
    access: "invitation",
  },
  pass: { path: "/p/[pass]", label: "Your gate pass", audience: "guest", access: "pass" },
  order: { path: "/order", label: "Order to your table", audience: "guest", access: "public" },
  staff: { path: "/staff", label: "Staff home", audience: "staff", access: "public" },
  bar: { path: "/bar", label: "Bar board", audience: "staff", access: "public" },
  checkin: { path: "/checkin", label: "Gate check-in", audience: "staff", access: "public" },
  kitchen: { path: "/kitchen", label: "Kitchen board", audience: "staff", access: "public" },
  admin: { path: "/admin", label: "Wedding control room", audience: "admin", access: "admin" },
  adminSharing: { path: "/admin/sharing", label: "Sharing", audience: "admin", access: "admin" },
  adminGuests: { path: "/admin/guests", label: "Guests", audience: "admin", access: "admin" },
  adminSeating: {
    path: "/admin/guests/seating",
    label: "Seating",
    audience: "admin",
    access: "admin",
  },
  adminGatePrint: {
    path: "/admin/guests/print",
    label: "Print gate list",
    audience: "admin",
    access: "admin",
  },
  adminGuestNew: {
    path: "/admin/guests/new",
    label: "Add an invitation",
    audience: "admin",
    access: "admin",
  },
  adminGuestEdit: {
    path: "/admin/guests/[id]/edit",
    label: "Edit invitation",
    audience: "admin",
    access: "admin",
  },
  adminMenu: { path: "/admin/menu", label: "Menu", audience: "admin", access: "admin" },
  adminThemes: { path: "/admin/themes", label: "Themes", audience: "admin", access: "admin" },
  adminSettings: { path: "/admin/settings", label: "Settings", audience: "admin", access: "admin" },
  adminStaff: { path: "/admin/staff", label: "Staff", audience: "admin", access: "admin" },
  adminClosure: {
    path: "/admin/event-closure",
    label: "After the celebration",
    audience: "admin",
    access: "admin",
  },
  adminSignIn: { path: "/admin/sign-in", label: "Sign in", audience: "admin", access: "public" },
  adminSignOut: { path: "/admin/sign-out", label: "Sign out", audience: "admin", access: "public" },
  adminMfa: {
    path: "/admin/mfa",
    label: "Verify your sign-in",
    audience: "admin",
    access: "session",
  },
  offline: { path: "/offline", label: "Offline help", audience: "guest", access: "public" },
  devTheme: { path: "/dev/theme", label: "Theme preview", audience: "dev", access: "preview" },
  dev: { path: "/dev", label: "Page previews", audience: "dev", access: "preview" },
  devInvitation: {
    path: "/dev/invitation",
    label: "Invitation preview",
    audience: "dev",
    access: "preview",
  },
  devLetter: {
    path: "/dev/invitation/letter",
    label: "Letter preview",
    audience: "dev",
    access: "preview",
  },
  devRsvp: { path: "/dev/rsvp", label: "RSVP preview", audience: "dev", access: "preview" },
  devOrder: { path: "/dev/order", label: "Ordering preview", audience: "dev", access: "preview" },
  devPass: { path: "/dev/pass", label: "Gate pass preview", audience: "dev", access: "preview" },
  devShare: { path: "/dev/share", label: "Sharing preview", audience: "dev", access: "preview" },
  devAdmin: {
    path: "/dev/admin",
    label: "Admin shell preview",
    audience: "dev",
    access: "preview",
  },
} as const satisfies Record<string, AppRoute>;

export const routeList = Object.values(appRoutes);

/** Token validation belongs to the invitation boundary; URL encoding keeps a single segment. */
export function invitationHref(token: string): string {
  return appRoutes.invitation.path.replace("[token]", encodeURIComponent(token));
}

/** Read-only pass paths never expose an invitation editing credential. */
export function passHref(pass: string): string {
  return appRoutes.pass.path.replace("[pass]", encodeURIComponent(pass));
}

/** Public error-state fixtures; never put real credentials into the route inventory. */
export const pageRouteSamples = routeList.map((route) => {
  if (route.path === appRoutes.invitation.path) return invitationHref("invalid");
  if (route.path === appRoutes.pass.path) return passHref("invalid");
  if (route.path === appRoutes.adminGuestEdit.path) return "/admin/guests/invalid/edit";
  return route.path;
});
