/** Runs once when the server starts: fail fast on missing or invalid env. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { parseClientEnv, parseServerEnv } = await import("./modules/shared/lib/env/schema");
    parseServerEnv(process.env);
    parseClientEnv(process.env);
  }
}
