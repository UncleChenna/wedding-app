import { Suspense } from "react";
import { connection } from "next/server";

import { appRoutes } from "../lib/routes";
import { createLogger } from "../lib/logger";
import type { StaffRole } from "../server/staff-auth";
import { currentStaff } from "../server/staff-cookies";
import { staffSignOutAction } from "../server/staff-actions";
import { PagePlaceholder } from "./page-placeholder";
import { StaffSignIn } from "./staff-sign-in";
import { Button } from "./ui/button";

const stations = {
  gate: {
    title: "Gate check-in",
    description:
      "QR check-in is coming soon. For now, ask the gate lead to help welcome your guest.",
  },
  kitchen: {
    title: "Kitchen board",
    description: "The food board is coming soon. For now, check orders with your station lead.",
  },
  bar: {
    title: "Bar board",
    description: "The drinks board is coming soon. For now, check orders with your station lead.",
  },
} as const;
const log = createLogger({ module: "staff-auth" });

async function StaffEntryContent({ role }: { role: StaffRole }) {
  await connection();
  let authenticated = false;
  try {
    authenticated = Boolean(await currentStaff(role));
  } catch {
    log.warn("staff session unavailable");
  }
  const station = stations[role];
  return (
    <PagePlaceholder
      eyebrow="Staff"
      title={station.title}
      description={
        authenticated ? station.description : "Sign in with your staff PIN to open this station."
      }
      backTo={appRoutes.staff}
    >
      {authenticated ? (
        <>
          <p className="text-lg leading-relaxed" role="status">
            You’re signed in.
          </p>
          <form action={staffSignOutAction}>
            <Button type="submit" variant="secondary" size="lg">
              Sign out
            </Button>
          </form>
        </>
      ) : (
        <StaffSignIn role={role} />
      )}
    </PagePlaceholder>
  );
}

export function StaffEntry({ role }: { role: StaffRole }) {
  return (
    <Suspense
      fallback={
        <PagePlaceholder
          eyebrow="Staff"
          title={stations[role].title}
          description="Getting your station ready…"
          backTo={appRoutes.staff}
        />
      }
    >
      <StaffEntryContent role={role} />
    </Suspense>
  );
}
