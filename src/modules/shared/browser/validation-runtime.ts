import { config } from "zod/mini";

// Zod's optional evaluation probe emits a CSP violation even when its exception
// is caught. Initialize before schemas in both Next and the standalone scanner;
// interpreted parsing preserves validation without permitting unsafe-eval.
config({ jitless: true });
