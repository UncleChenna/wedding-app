/** Ticket work is integrated only through PRs to develop that pass CI. */
export const REVIEW_BASE = "develop";

/**
 * CI runs scope-selected PR checks and full verification before release; review hand-off runs the quick
 * check locally. `--full` runs the whole suite locally as well.
 */
export function reviewVerifyScript(flags: Record<string, unknown>): "verify" | "verify:quick" {
  return flags.full === true ? "verify" : "verify:quick";
}
export const REVIEW_SECTIONS = [
  "Summary",
  "Changes",
  "Acceptance criteria and evidence",
  "Verification",
  "Risks and rollout",
] as const;

export function reviewBodyProblems(body: string): string[] {
  const text = body.replace(/<!--[\s\S]*?-->/g, "");
  return REVIEW_SECTIONS.flatMap((heading) => {
    const content = new RegExp(`^#{1,2} ${heading}\\s*\\n([\\s\\S]*?)(?=^#{1,2} |$(?![\\s\\S]))`, "m").exec(text)?.[1]?.trim();
    return content && content.length >= 20
      ? []
      : [`PR body needs a task-specific "${heading}" section (not an empty template).`];
  });
}
