#!/usr/bin/env bash
# PostToolUse hook: format and lint the file Claude just edited.
# Exit 2 sends ESLint errors back to Claude so it fixes them.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

file=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.tool_input?.file_path??"")}catch{}})')
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0
case "$(cd "$(dirname "$file")" && pwd)/" in "$PWD"/*) ;; *) exit 0 ;; esac  # only files in this repo

./node_modules/.bin/prettier --write --ignore-unknown --log-level=warn "$file" >/dev/null 2>&1

case "$file" in
  *.ts|*.tsx|*.js|*.mjs|*.cjs)
    if ! out=$(./node_modules/.bin/eslint --fix --max-warnings=0 --no-warn-ignored "$file" 2>&1); then
      echo "ESLint found problems in $file after auto-fix. Fix them:" >&2
      echo "$out" >&2
      exit 2
    fi
    ;;
esac
echo "formatted + linted: $file"
exit 0
