import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import type { AdmissionActor } from "../lib/online-admission";
import { resolveGuestRead } from "../lib/resolve-scan-read";
import { observationResult } from "../lib/scan-observation";
import { manualResponse } from "./manual-response";
import { searchManualGuests } from "./manual-search-repository";
import { admitVerifiedPass } from "./online-admission";
import { recordScanObservation } from "./scan-observation";
import { readScanGuest } from "./scan-read-repository";

async function actor(): Promise<AdmissionActor | null> {
  const current = await currentStaffDevice("gate");
  return current
    ? {
        staffId: current.identity.staffId,
        deviceId: current.device.id,
        credentialVersion: current.identity.credentialVersion,
      }
    : null;
}
async function stillAuthorized(identity: AdmissionActor) {
  const current = await actor();
  return (
    current !== null &&
    current.staffId === identity.staffId &&
    current.deviceId === identity.deviceId &&
    current.credentialVersion === identity.credentialVersion
  );
}

export function postManualCheckin(request: Request) {
  return manualResponse(request, {
    authorize: actor,
    search: (query) => searchManualGuests(db, query),
    read: async (input, identity) => {
      const row = await readScanGuest(db, input.invitationId);
      const result = resolveGuestRead(row, row?.tokenVersion ?? 1);
      const verdict = observationResult(result.state);
      if (verdict !== null) {
        const recorded = await recordScanObservation(
          db,
          identity,
          {
            invitationId: row ? input.invitationId : null,
            result: verdict,
            inputMethod: "manual",
            reportedAt: new Date(),
          },
          () => stillAuthorized(identity),
        );
        if (!recorded) return { state: "session_expired" };
      }
      return {
        state: "selection",
        invitationId: input.invitationId,
        version: row?.tokenVersion ?? 1,
        result,
      };
    },
    admit: (input, identity) =>
      admitVerifiedPass(
        db,
        identity,
        {
          invitationId: input.invitationId,
          passVersion: input.version,
          clientEventId: input.clientEventId,
          people: input.people,
          inputMethod: "manual",
        },
        () => stillAuthorized(identity),
      ),
  });
}
