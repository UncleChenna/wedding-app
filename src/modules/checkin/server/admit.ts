import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import { verifyGatePass } from "../lib/gate-token";
import { signedPassToken } from "../lib/signed-pass-url";
import { admissionResponse } from "./admission-response";
import { admitVerifiedPass } from "./online-admission";
import { gatePublicKeys, loadGateSigningKeys } from "./signing";

async function actor() {
  const current = await currentStaffDevice("gate");
  return current
    ? {
        staffId: current.identity.staffId,
        deviceId: current.device.id,
        credentialVersion: current.identity.credentialVersion,
      }
    : null;
}
export function postAdmission(request: Request) {
  return admissionResponse(request, {
    authorize: actor,
    submit: async (input, identity, origin) => {
      const token = signedPassToken(input.qr, origin);
      if (!token) return { state: "invalid" };
      const keys = loadGateSigningKeys();
      if (!keys.ok) return { state: "unavailable" };
      const verified = await verifyGatePass(token, gatePublicKeys(keys.value), { now: Date.now() });
      if (!verified.ok) return { state: "invalid" };
      return admitVerifiedPass(
        db,
        identity,
        {
          clientEventId: input.clientEventId,
          invitationId: verified.payload.inv,
          passVersion: verified.payload.ver,
          people: input.people,
        },
        async () => {
          const current = await actor();
          return (
            current !== null &&
            current.staffId === identity.staffId &&
            current.deviceId === identity.deviceId &&
            current.credentialVersion === identity.credentialVersion
          );
        },
      );
    },
  });
}
