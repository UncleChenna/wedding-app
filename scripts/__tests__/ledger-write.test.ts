import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, expect, it } from "vitest";

import { isolatedGitEnv } from "./git-env";

const roots: string[] = [];
const source = resolve("scripts/tickets/git.ts");
const tsx = resolve("node_modules/tsx/dist/loader.mjs");
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ledger-write-proof-"));
  roots.push(root);
  const cwd = join(root, "checkout");
  const ownedTemp = join(root, "owned-temp");
  const bin = join(root, "bin");
  const log = join(root, "probe.jsonl");
  const commandLog = join(root, "commands.jsonl");
  mkdirSync(ownedTemp, { mode: 0o700 });
  mkdirSync(bin, { mode: 0o700 });
  const env = isolatedGitEnv({ TMPDIR: ownedTemp });
  const realGit = execFileSync("which", ["git"], { env, encoding: "utf8" }).trim();
  execFileSync(realGit, ["init", "--quiet", cwd], { env });
  const git = (...args: string[]) =>
    execFileSync(realGit, args, { cwd, env, encoding: "utf8" }).trim();
  git("config", "user.name", "Ledger Write Test");
  git("config", "user.email", "ledger-write@example.invalid");
  git("config", "core.hooksPath", "/dev/null");
  git("commit", "--quiet", "--allow-empty", "-m", "fixture");
  const wrapper = `#!${process.execPath}
const fs=require('node:fs'), cp=require('node:child_process'), path=require('node:path');
const args=process.argv.slice(2);
if(['hash-object','update-index','write-tree','commit-tree'].includes(args[0])) {
  const input=fs.fstatSync(0);
  fs.appendFileSync(${JSON.stringify(commandLog)},JSON.stringify({command:args[0],piped:input.isFIFO()||input.isSocket()})+'\\n');
}
if(args[0]==='hash-object') {
  if(args.includes('--stdin')) { console.error('standard input path forbidden'); process.exit(41); }
  const file=args.at(-1), dir=path.dirname(file);
  fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({file,dir,raw:args.includes('--no-filters'),mode:fs.statSync(file).mode&511,dirMode:fs.statSync(dir).mode&511,data:JSON.parse(fs.readFileSync(file,'utf8'))})+'\\n');
  if(process.env.LEDGER_PROBE_MODE==='fail') process.exit(42);
  if(process.env.LEDGER_PROBE_MODE==='stall') {
    process.on('SIGTERM',()=>{});
    setTimeout(()=>process.exit(43),5000);
  } else cp.execFileSync(${JSON.stringify(realGit)},args,{stdio:'inherit'});
} else cp.execFileSync(${JSON.stringify(realGit)},args,{stdio:'inherit'});
`;
  writeFileSync(join(bin, "git"), wrapper, { mode: 0o700 });
  let serial = 0;
  const run = (body: string, probe?: string) => {
    const script = join(root, `worker-${serial++}.mts`);
    writeFileSync(script, `import * as ledger from ${JSON.stringify(source)};\n${body}`);
    return execFileSync(process.execPath, ["--import", tsx, script], {
      cwd,
      env: probe
        ? { ...env, PATH: `${bin}${delimiter}${env.PATH}`, LEDGER_PROBE_MODE: probe }
        : env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    }).trim();
  };
  run(
    `ledger.mutateLedger(process.cwd(), 'local', data => { data.lastId=1; return {result:null,message:'seed'}; });`,
  );
  const value = () => run(`console.log(ledger.readLedger(process.cwd(),'local')?.data.lastId);`);
  const logs = () =>
    readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map(
        (line) =>
          JSON.parse(line) as {
            file: string;
            dir: string;
            mode: number;
            dirMode: number;
            data: { lastId: number };
            raw: boolean;
          },
      );
  const leftover = () =>
    readdirSync(ownedTemp).filter((name) => name.startsWith("wedding-ledger-"));
  const commands = () =>
    readFileSync(commandLog, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { command: string; piped: boolean });
  return { cwd, run, value, logs, leftover, commands };
}

it("writes the unchanged ledger through a private file and removes its workspace", () => {
  const f = fixture();
  f.run(
    `ledger.mutateLedger(process.cwd(),'local', data => { data.lastId=2; return {result:null,message:'next'}; });`,
    "normal",
  );
  expect(f.value()).toBe("2");
  expect(f.logs()).toHaveLength(1);
  expect(f.commands().map((entry) => entry.command)).toEqual([
    "hash-object",
    "update-index",
    "write-tree",
    "commit-tree",
  ]);
  expect(f.commands().every((entry) => !entry.piped)).toBe(true);
  const record = f.logs()[0];
  expect(record).toBeDefined();
  expect(record?.raw).toBe(true);
  expect(record?.mode).toBe(0o600);
  expect(record?.dirMode).toBe(0o700);
  expect(record?.data.lastId).toBe(2);
  expect(record && existsSync(record.file)).toBe(false);
  expect(record && existsSync(record.dir)).toBe(false);
  expect(f.leftover()).toEqual([]);
});

it("cleans failed attempts, preserves the ledger and allows a later normal writer", () => {
  const f = fixture();
  const result = f.run(
    `try { ledger.mutateLedger(process.cwd(),'local', data => { data.lastId=99; return {result:null,message:'reject'}; }); } catch(error) { console.log(error.message); }`,
    "fail",
  );
  expect(result).toContain("after 3 attempts");
  expect(f.logs()).toHaveLength(3);
  expect(f.leftover()).toEqual([]);
  expect(existsSync(join(f.cwd, ".git/harness-tickets.lock"))).toBe(false);
  expect(f.value()).toBe("1");
  f.run(
    `ledger.mutateLedger(process.cwd(),'local', data => { data.lastId++; return {result:null,message:'recover'}; });`,
  );
  expect(f.value()).toBe("2");
});

it("bounds a stalled preparation child even if it ignores SIGTERM and releases only its workspace", () => {
  const f = fixture();
  const started = performance.now();
  const result = f.run(
    `try { ledger.mutateLedger(process.cwd(),'local', data => { data.lastId=99; return {result:null,message:'timeout'}; }, {preparationTimeoutMs:300}); } catch(error) { console.log(error.message); }`,
    "stall",
  );
  expect(performance.now() - started).toBeLessThan(5000);
  expect(result).toContain("ETIMEDOUT");
  expect(f.leftover()).toEqual([]);
  expect(existsSync(join(f.cwd, ".git/harness-tickets.lock"))).toBe(false);
  expect(f.value()).toBe("1");
  f.run(
    `ledger.mutateLedger(process.cwd(),'local', data => { data.lastId++; return {result:null,message:'recover'}; });`,
  );
  expect(f.value()).toBe("2");
}, 30_000);

it("rejects disabled or unbounded preparation budgets before changing the ledger", () => {
  const f = fixture();
  const result = f.run(`for (const preparationTimeoutMs of [0,-1,1.5,NaN,Infinity,30001]) {
    try { ledger.mutateLedger(process.cwd(),'local', () => { throw new Error('must not run'); }, {preparationTimeoutMs}); }
    catch(error) { console.log(error.name); }
  }`);
  expect(result.split("\n")).toEqual(Array(6).fill("RangeError"));
  expect(f.value()).toBe("1");
  expect(existsSync(join(f.cwd, ".git/harness-tickets.lock"))).toBe(false);
});
