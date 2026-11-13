import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import postgres from "postgres";
import { assertDatabaseTarget } from "./database-target";

process.loadEnvFile(".env.local");
assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
const db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
const token = randomBytes(32).toString("base64url");
let id: string | undefined;
try {
  const [fixture] = await db<
    { id: string }[]
  >`insert into invitations(token, household_name, status) values(${token}, 'Hero review fixture', 'sent') returning id`;
  id = fixture?.id;
  if (!id) throw new Error("Hero fixture was not created");
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "playwright",
      "test",
      "e2e/invitation-hero.spec.ts",
      "--project=desktop",
      "--workers=1",
    ],
    {
      stdio: "inherit",
      env: { ...process.env, INVITATION_HERO_PATH: `/i/${token}` },
    },
  );
  process.exitCode = result.status ?? 1;
} finally {
  // Keep the immutable invitation ledger intact; expire only the fixture created here.
  if (id) await db`update invitations set status='revoked' where id=${id} and token=${token}`;
  await db.end();
}
