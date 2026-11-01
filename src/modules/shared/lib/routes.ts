export type RouteAudience = "guest" | "staff" | "admin" | "dev";
export type RouteAccess = "public" | "invitation" | "session" | "admin" | "preview";

export interface AppRoute {
  readonly path: `/${string}`;
  readonly label: string;
  readonly audience: RouteAudience;
  readonly access: RouteAccess;
}

/** Navigation metadata is not authorization; server readers still enforce access. */
export const appRoutes = {
  home: { path: "/", label: "Our day", audience: "guest", access: "public" },
  invite: { path: "/invite", label: "Your invitation", audience: "guest", access: "public" },
  invitation: {
    path: "/i/[token]",
    label: "Your invitation",
    audience: "guest",
    access: "invitation",
  },
  order: { path: "/order", label: "Order to your table", audience: "guest", access: "public" },
  staff: { path: "/staff", label: "Staff home", audience: "staff", access: "public" },
  bar: { path: "/bar", label: "Bar board", audience: "staff", access: "public" },
  checkin: { path: "/checkin", label: "Gate check-in", audience: "staff", access: "public" },
  kitchen: { path: "/kitchen", label: "Kitchen board", audience: "staff", access: "public" },
  admin: { path: "/admin", label: "Wedding control room", audience: "admin", access: "admin" },
  adminSharing: { path: "/admin/sharing", label: "Sharing", audience: "admin", access: "admin" },
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
  devShare: { path: "/dev/share", label: "Sharing preview", audience: "dev", access: "preview" },
} as const satisfies Record<string, AppRoute>;

export const routeList = Object.values(appRoutes);

/** Token validation belongs to the invitation boundary; URL encoding keeps a single segment. */
export function invitationHref(token: string): string {
  return appRoutes.invitation.path.replace("[token]", encodeURIComponent(token));
}

/** Public error-state fixture; never place a real invitation token in the route inventory. */
export const pageRouteSamples = routeList.map((route) =>
  route.path === appRoutes.invitation.path ? invitationHref("invalid") : route.path,
);
