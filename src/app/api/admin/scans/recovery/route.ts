import { currentAdminAccess } from "@/modules/admin/server/current-admin-access";
import { recoveryImportResponse } from "@/modules/checkin/server/recovery-response";
import { reconcileRecoveredScans } from "@/modules/checkin/server/reconcile-scans";
import { db } from "@/modules/shared/server/db/client";
import { staffSigningKey } from "@/modules/shared/server/staff-cookies";
export function POST(request: Request) {
  return recoveryImportResponse(request, {
    authorize: async () => {
      const access = await currentAdminAccess();
      return access.status === "ready" ? access.userId : null;
    },
    key: staffSigningKey,
    reconcile: (admin, requestId, records, reauthorize) =>
      reconcileRecoveredScans(db, admin, requestId, records, reauthorize),
  });
}
