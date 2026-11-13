#!/usr/bin/env bash
# Explicit owner action only; this script is never invoked by onboarding or CI.
# Check names match .github/workflows/ci.yml and pr-text.yml. Admins are not enforced, so the owner can
# still merge a release in an emergency when the other code owner can't review (owner's choice, TICKET-005).
set -euo pipefail
command -v gh >/dev/null || { echo 'Install GitHub CLI first.' >&2; exit 1; }
repo="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
if grep -q '@REPLACE_ME_' .github/CODEOWNERS; then
  echo 'Replace CODEOWNERS placeholders before enabling protection.' >&2
  exit 1
fi
gh api --method PUT "repos/$repo/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint, types, unit tests", "no AI attribution in PR text"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
