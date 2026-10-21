import "server-only";

import { parseServerEnv } from "../lib/env/schema";

/** Server-only env. Importing this from a Client Component fails the build. */
export const serverEnv = parseServerEnv(process.env);
