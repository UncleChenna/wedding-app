import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { currentAdminAccess } from "./current-admin-access";
import { appendScanNote, readScanLogPage } from "./scan-log-repository";
import type { ScanLogPorts } from "./scan-log-service";

export const scanLogPorts: ScanLogPorts = {
  access: currentAdminAccess,
  read: (filters) => readScanLogPage(db, filters),
  append: (input) => appendScanNote(db, input),
  warn: (message) => createLogger({ module: "admin-scan-log" }).warn(message),
};
