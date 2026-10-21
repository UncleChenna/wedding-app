import { describe, expect, it } from "vitest";
import { REVIEW_BASE, REVIEW_SECTIONS, reviewBodyProblems } from "../tickets/review";

describe("ticket review contract", () => {
  it("targets develop", () => expect(REVIEW_BASE).toBe("develop"));
  it("rejects blank/comment-only template sections", () => {
    expect(
      reviewBodyProblems(
        REVIEW_SECTIONS.map((name) => `# ${name}\n<!-- Fill this in -->\n`).join("\n"),
      ),
    ).toHaveLength(5);
  });
  it("requires each evidence section, including the final section", () => {
    const body = REVIEW_SECTIONS.map(
      (name) => `# ${name}\nTask-specific details and evidence for this change.\n`,
    ).join("\n");
    expect(reviewBodyProblems(body)).toEqual([]);
    expect(reviewBodyProblems(body.replace(/# Verification\n[^#]+/, ""))).toHaveLength(1);
  });
});
