#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cli, root, run, writeJson } from "./harness/io.mjs";
cli(async () => {
  const cwd = root();
  const target = join(cwd, "tooling/plugin/dist");
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  mkdirSync(join(target, ".claude-plugin"));
  cpSync(
    join(cwd, "tooling/plugin/.claude-plugin/plugin.json"),
    join(target, ".claude-plugin/plugin.json"),
  );
  cpSync(join(cwd, ".agents/skills"), join(target, "skills"), { recursive: true });
  cpSync(join(cwd, ".claude/agents"), join(target, "agents"), { recursive: true });
  cpSync(join(cwd, "scripts/harness"), join(target, "scripts/harness"), { recursive: true });
  mkdirSync(join(target, "hooks"));
  // Bundled fallback works from cache; avoid executing twice in this repository.
  writeFileSync(
    join(target, "hooks/dispatch.mjs"),
    `import { existsSync, readFileSync } from "node:fs";\nimport { execFileSync } from "node:child_process";\nimport { join } from "node:path";\nconst root = execFileSync("git",["rev-parse","--show-toplevel"],{encoding:"utf8"}).trim();\nconst settings=join(root,".claude/settings.json");\nif(existsSync(settings)&&readFileSync(settings,"utf8").includes("scripts/harness/hooks.mjs")) { console.log("{}"); } else { const {main}=await import("../scripts/harness/hooks.mjs"); await main(); }\n`,
  );
  writeJson(join(target, "hooks/hooks.json"), {
    hooks: Object.fromEntries(
      [
        ["PreToolUse", "pre"],
        ["PostToolUse", "post"],
        ["Stop", "stop"],
      ].map(([event, mode]) => [
        event,
        [
          {
            hooks: [
              {
                type: "command",
                command: `node "\${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs" ${mode} claude`,
                timeout: 600,
              },
            ],
          },
        ],
      ]),
    ),
  });
  console.log("Built tooling/plugin/dist from canonical skills, reviewers and hook code.");
  if (process.argv[2] === "install") {
    console.log(run("claude", ["plugin", "validate", target], { cwd }));
    console.log(
      run("claude", ["plugin", "marketplace", "add", join(cwd, "tooling/plugin")], { cwd }),
    );
    console.log(
      run("claude", ["plugin", "install", "wedding-harness@wedding-team", "--scope", "local"], {
        cwd,
      }),
    );
  }
});
