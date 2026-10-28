import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { mergedReviewEvidence } from "../tickets/merged-review";
import { isolatedGitEnv } from "./git-env";

const scratch: string[] = [];
function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd,
    env: isolatedGitEnv(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
function runGit(args: string[], cwd: string) {
  try {
    return git(cwd, ...args);
  } catch {
    return null;
  }
}
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "merged-review-"));
  scratch.push(dir);
  const remote = join(dir, "remote.git");
  const source = join(dir, "source");
  const reader = join(dir, "reader");
  git(dir, "init", "--bare", remote);
  git(dir, "init", "-b", "develop", source);
  git(source, "config", "user.name", "Test");
  git(source, "config", "user.email", "test@example.test");
  writeFileSync(join(source, "ticket.md"), "- [ ] unfinished");
  git(source, "add", ".");
  git(source, "commit", "-m", "base");
  git(source, "remote", "add", "origin", remote);
  git(source, "push", "origin", "develop");
  git(dir, "clone", "-b", "develop", remote, reader);
  git(source, "checkout", "-b", "historical-stack");
  writeFileSync(join(source, "ticket.md"), "- [x] merged criteria");
  git(source, "commit", "-am", "merged stacked ticket");
  const oid = git(source, "rev-parse", "HEAD");
  git(source, "checkout", "develop");
  git(source, "merge", "--no-ff", "historical-stack", "-m", "integrate stack");
  git(source, "push", "origin", "develop");
  const pr = {
    url: "https://example.test/pr/4",
    state: "MERGED",
    baseRefName: "historical-stack",
    mergeCommit: { oid },
  };
  return { remote, source, reader, pr };
}
afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true });
});
describe("merged PR completion evidence", () => {
  it("fetches fresh develop for a stacked PR and reads criteria from that exact commit", () => {
    const { reader, pr } = fixture();
    expect(git(reader, "show", "origin/develop:ticket.md")).toContain("unfinished");
    expect(mergedReviewEvidence(reader, pr, "ticket.md", runGit)).toMatchObject({
      url: pr.url,
      ticketText: "- [x] merged criteria",
    });
  });
  it("still accepts a direct develop merge", () => {
    const { reader, pr } = fixture();
    expect(
      mergedReviewEvidence(reader, { ...pr, baseRefName: "develop" }, "ticket.md", runGit)?.url,
    ).toBe(pr.url);
  });
  it.each(["OPEN", "CLOSED"])("rejects %s even with a reachable commit", (state) => {
    const { reader, pr } = fixture();
    expect(mergedReviewEvidence(reader, { ...pr, state }, "ticket.md", runGit)).toBeNull();
  });
  it("rejects unreachable commits", () => {
    const { reader, source, pr } = fixture();
    git(source, "checkout", "-b", "unmerged");
    git(source, "commit", "--allow-empty", "-m", "not on develop");
    const oid = git(source, "rev-parse", "HEAD");
    git(source, "push", "origin", "unmerged");
    git(reader, "fetch", "origin", "unmerged");
    expect(
      mergedReviewEvidence(reader, { ...pr, mergeCommit: { oid } }, "ticket.md", runGit),
    ).toBeNull();
  });
  it("rejects missing metadata, unavailable history and missing ticket content", () => {
    const { reader, pr } = fixture();
    expect(mergedReviewEvidence(reader, null, "ticket.md", runGit)).toBeNull();
    expect(
      mergedReviewEvidence(reader, { ...pr, mergeCommit: null }, "ticket.md", runGit),
    ).toBeNull();
    expect(
      mergedReviewEvidence(
        reader,
        { ...pr, mergeCommit: { oid: "f".repeat(40) } },
        "ticket.md",
        runGit,
      ),
    ).toBeNull();
    expect(mergedReviewEvidence(reader, pr, "missing.md", runGit)).toBeNull();
  });
  it("rejects failed fetch despite cached ancestry and checked local criteria", () => {
    const { reader, pr } = fixture();
    expect(mergedReviewEvidence(reader, pr, "ticket.md", runGit)).not.toBeNull();
    writeFileSync(join(reader, "ticket.md"), "- [x] local only");
    git(reader, "remote", "set-url", "origin", join(reader, "missing.git"));
    expect(mergedReviewEvidence(reader, pr, "ticket.md", runGit)).toBeNull();
  });
});
