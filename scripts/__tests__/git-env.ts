/**
 * Environment for tests that run git against throwaway repositories.
 *
 * Git exports GIT_DIR, GIT_INDEX_FILE, GIT_WORK_TREE and friends while it runs
 * hooks. Tests run from the pre-commit hook inherit them, so a bare
 * `git init`/`git commit` in a temp directory would act on the real repository
 * (it once rewrote the branch and set core.bare=true). Always spawn git, and any
 * script that runs git, with this environment.
 */
export function isolatedGitEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
  );
  return { ...env, NODE_ENV: process.env.NODE_ENV, GIT_CONFIG_NOSYSTEM: "1", ...extra };
}
