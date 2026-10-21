#!/usr/bin/env bash
# Run Claude Code headless over the next pending task in docs/tasks.json.
# One task per iteration; stops on the first failure.
#
#   scripts/agent-loop.sh                     # one task
#   scripts/agent-loop.sh --max-iterations 3  # up to three tasks, one after another
#   scripts/agent-loop.sh --task SETUP-002    # a specific task
#   scripts/agent-loop.sh --dry-run           # show what would run
#
# Each run uses /implement, the project allowlist in .claude/settings.json
# (anything else is denied, never prompted) and the project hooks. After
# Claude finishes, the script checks the task is marked done, the tree is
# committed, and runs `pnpm verify` itself as an independent gate.
set -euo pipefail

usage() {
  sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
  cat <<'USAGE'

Options:
  --max-iterations N   Max tasks to run (default 1)
  --task ID            Run this task instead of the next pending one
  --model NAME         Claude model alias or id (default: your Claude Code default)
  --max-budget-usd N   Spend cap per task (passed to claude)
  --dry-run            Print the next task and command, run nothing
  -h, --help           Show this help
USAGE
}

max_iterations=1
task_override=""
model=""
budget=""
dry_run=false

while [ $# -gt 0 ]; do
  case "$1" in
    --max-iterations) max_iterations="$2"; shift 2 ;;
    --task) task_override="$2"; shift 2 ;;
    --model) model="$2"; shift 2 ;;
    --max-budget-usd) budget="$2"; shift 2 ;;
    --dry-run) dry_run=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 64 ;;
  esac
done

if ! [[ "$max_iterations" =~ ^[1-9][0-9]*$ ]]; then
  echo "--max-iterations must be a positive integer" >&2; exit 64
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"
tasks_file="docs/tasks.json"
log_dir="logs/agent-loop"
mkdir -p "$log_dir"

# Print the id of the next runnable task (pending, all dependsOn done), or nothing.
next_task() {
  node -e '
    const { tasks } = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const done = new Set(tasks.filter((t) => t.status === "done").map((t) => t.id));
    const next = tasks.find((t) => t.status === "pending" && (t.dependsOn ?? []).every((d) => done.has(d)));
    if (next) process.stdout.write(next.id);
  ' "$tasks_file"
}

task_field() {
  node -e '
    const { tasks } = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const t = tasks.find((t) => t.id === process.argv[2]);
    if (!t) process.exit(3);
    process.stdout.write(String(t[process.argv[3]] ?? ""));
  ' "$tasks_file" "$1" "$2"
}

set_status() {
  node -e '
    const fs = require("fs");
    const [file, id, status] = process.argv.slice(1);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const t = data.tasks.find((t) => t.id === id);
    t.status = status;
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  ' "$tasks_file" "$1" "$2"
}

command -v claude >/dev/null || { echo "claude CLI not found on PATH" >&2; exit 1; }

for ((i = 1; i <= max_iterations; i++)); do
  if [ -n "$task_override" ]; then
    task="$task_override"; task_override=""
    task_field "$task" id >/dev/null || { echo "Unknown task: $task" >&2; exit 1; }
  else
    task="$(next_task)"
  fi
  if [ -z "$task" ]; then
    echo "No runnable pending tasks. Done after $((i - 1)) iteration(s)."
    exit 0
  fi

  title="$(task_field "$task" title)"
  status="$(task_field "$task" status)"
  if [ "$status" = "done" ]; then echo "$task is already done." >&2; exit 1; fi

  cmd=(claude -p "/implement $task" --permission-mode acceptEdits --output-format text)
  [ -n "$model" ] && cmd+=(--model "$model")
  [ -n "$budget" ] && cmd+=(--max-budget-usd "$budget")

  echo "━━━ Iteration $i/$max_iterations: $task — $title"
  if $dry_run; then
    printf 'Would run:'; printf ' %q' "${cmd[@]}"; echo
    continue
  fi

  if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is not clean. Commit or stash first so each task is one commit." >&2
    exit 1
  fi

  log="$log_dir/$(date +%Y%m%d-%H%M%S)-$task.log"
  echo "Log: $log"
  start_sha="$(git rev-parse HEAD)"

  set +e
  "${cmd[@]}" 2>&1 | tee "$log"
  rc=${PIPESTATUS[0]}
  set -e

  final_status="$(task_field "$task" status)"
  if [ "$rc" -ne 0 ]; then
    echo "✖ claude exited with $rc on $task. Stopping." >&2; exit 1
  fi
  if [ "$final_status" != "done" ]; then
    echo "✖ $task ended with status '$final_status' (expected done). Stopping." >&2; exit 1
  fi
  if [ "$(git rev-parse HEAD)" = "$start_sha" ]; then
    echo "✖ $task made no commit. Stopping." >&2; exit 1
  fi
  if [ -n "$(git status --porcelain)" ]; then
    echo "✖ $task left uncommitted changes. Stopping." >&2; git status --short >&2; exit 1
  fi

  echo "━━━ Independent gate: pnpm verify"
  if ! pnpm -s verify >>"$log" 2>&1; then
    set_status "$task" blocked
    echo "✖ pnpm verify failed after $task (see $log). Task set to blocked; change left uncommitted for review." >&2
    exit 1
  fi
  echo "✔ $task done: $(git log -1 --format='%h %s')"
done

echo "Reached --max-iterations ($max_iterations)."
