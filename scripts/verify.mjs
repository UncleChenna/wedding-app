import { runVerification } from "./harness/verification.mjs";
if (!runVerification(process.cwd())) process.exitCode = 1;
