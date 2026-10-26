import { accessSync, constants, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, isAbsolute, join } from "node:path";

/** Resolve once, without a shell or network install, and pass the same runtime to children.
 * @param {Record<string, string | undefined>} env
 */
export function pnpmRuntime(env = process.env, home = homedir(), node = process.execPath) {
  const name = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const inherited = (env.PATH ?? "").split(delimiter).filter(Boolean);
  const fallback = [
    env.PNPM_HOME,
    dirname(node),
    join(home, ".npm-global", "bin"),
    join(home, ".local", "share", "pnpm"),
    join(home, "Library", "pnpm"),
  ].filter((path) => path && isAbsolute(path));
  for (const directory of [...inherited, ...fallback]) {
    const executable = join(directory, name);
    try {
      if (!statSync(executable).isFile()) continue;
      accessSync(executable, constants.X_OK);
    } catch {
      continue;
    }
    return {
      executable,
      env: { ...env, PATH: [...new Set([...inherited, dirname(node), directory])].join(delimiter) },
    };
  }
  throw new Error(
    "Cannot locate pnpm. Add its installation directory to the agent PATH or set PNPM_HOME, then restart the agent. Verification has not run.",
  );
}
