import { appendFileSync } from "node:fs";
import { validateGates } from "./ci-selection.mjs";
const needs = JSON.parse(process.env.CI_NEEDS);
const outputs = needs.plan?.outputs;
if (
  needs.plan?.result !== "success" ||
  !outputs ||
  !["full", "database", "guest", "camera", "admin"].every((key) =>
    ["true", "false"].includes(outputs[key]),
  )
) {
  throw new Error("Missing or failed CI selection; verification is not certified");
}
const selected = {
  tickets: true,
  "pr-text": true,
  verify: true,
  database: outputs.database === "true",
  "guest-journey": outputs.guest === "true",
  lighthouse: outputs.guest === "true",
  "camera-decoding": outputs.camera === "true",
  "admin-journey": outputs.admin === "true",
};
const result = validateGates(
  selected,
  Object.fromEntries(Object.entries(needs).map(([key, value]) => [key, value.result])),
);
appendFileSync(
  process.env.GITHUB_STEP_SUMMARY,
  `## Required CI outcome\n${Object.entries(selected)
    .map(
      ([key, required]) =>
        `- ${key}: ${required ? "selected" : "not applicable"}; ${needs[key]?.result}`,
    )
    .join("\n")}\n`,
);
if (!result.ok) throw new Error(`Unsuccessful CI gates: ${result.failures.join(", ")}`);
