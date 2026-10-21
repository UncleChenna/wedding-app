#!/usr/bin/env bash
# Stop hook: run `pnpm verify:quick` when there are uncommitted changes.
# On failure, exit 2 so Claude keeps working and sees the failures.
# After 3 consecutive blocked stops, let Claude stop and tell the user.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0
cat >/dev/null  # hook input (unused)

attempts_file=".claude/.stop-hook-attempts"
max_attempts=3

if git rev-parse --verify -q HEAD >/dev/null && git diff --quiet HEAD -- \
  && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  rm -f "$attempts_file"
  exit 0  # nothing changed, nothing to verify
fi

if output=$(pnpm -s verify:quick 2>&1); then
  rm -f "$attempts_file"
  exit 0
fi

attempts=$(( $(cat "$attempts_file" 2>/dev/null || echo 0) + 1 ))
if [ "$attempts" -gt "$max_attempts" ]; then
  rm -f "$attempts_file"
  echo "{\"systemMessage\": \"pnpm verify:quick still failing after $max_attempts fix attempts. Stopping so a human can look.\"}"
  exit 0
fi
echo "$attempts" > "$attempts_file"

{
  echo "pnpm verify:quick FAILED (attempt $attempts/$max_attempts). Do not stop yet: fix these, then re-run pnpm verify:quick."
  echo "Never weaken or delete tests to make them pass."
  echo "----- last 80 lines -----"
  echo "$output" | tail -n 80
} >&2
exit 2
