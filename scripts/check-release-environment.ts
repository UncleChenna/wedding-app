import { validateReleaseEnvironment } from "./release-environment";

const args = process.argv.slice(2);
const profile = args[1];
if (
  args.length !== 2 ||
  args[0] !== "--profile" ||
  (profile !== "preview" && profile !== "production")
) {
  console.error("Usage: pnpm env:release --profile preview|production");
  process.exitCode = 1;
} else {
  const issues = validateReleaseEnvironment(process.env, profile);
  if (issues.length) {
    console.error(`Release ${profile} configuration failed:`);
    for (const issue of issues) console.error(`- ${issue.field}: ${issue.reason}`);
    console.error("See docs/deployment.md. No configuration was changed.");
    process.exitCode = 1;
  } else {
    console.log(
      `Release ${profile} configuration shape passed. Provider connectivity, environment isolation and deployed startup remain unverified.`,
    );
  }
}
