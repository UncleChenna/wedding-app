/** Ticket work is integrated only through human-reviewed PRs to develop. */
export const REVIEW_BASE = "develop";
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
