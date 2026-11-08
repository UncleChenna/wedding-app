// Export only the additive tables when exercising the legacy bootstrap schema.
export {
  admissionCounters,
  scanEvents,
  scanResult,
} from "../../src/modules/shared/server/db/schema";
