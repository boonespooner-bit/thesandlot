import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Deployment self-check: GET /api/health
// Reports whether required config is present and the database is reachable.
// Only booleans/counts are returned — never secret values.
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, boolean | string> = {
    databaseUrlSet: !!process.env.DATABASE_URL,
    sessionSecretSet: !!process.env.SESSION_SECRET,
    smtpConfigured: !!process.env.SMTP_HOST,
  };

  try {
    const users = await prisma.user.count();
    checks.databaseReachable = true;
    checks.migrationsApplied = true;
    checks.registeredUsers = String(users);
  } catch (err) {
    checks.databaseReachable = false;
    checks.databaseError =
      err instanceof Error ? err.message.split("\n")[0].slice(0, 200) : "unknown";
  }

  const ok =
    checks.databaseUrlSet === true &&
    checks.sessionSecretSet === true &&
    checks.databaseReachable === true;

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 500 });
}
