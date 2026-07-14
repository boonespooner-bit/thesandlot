import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { RoleSelect } from "@/components/RoleSelect";
import { GameStatusBadge } from "@/components/GameStatusBadge";
import { deleteGame } from "@/app/actions/admin";
import { cancelGame } from "@/app/actions/games";
import { formatShortDate, formatTime } from "@/lib/format";

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [users, games, emails] = await Promise.all([
    prisma.user.findMany({
      include: { _count: { select: { kids: true, coachSpots: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.game.findMany({
      include: {
        location: true,
        _count: { select: { signups: true } },
      },
      orderBy: { date: "desc" },
      take: 30,
    }),
    prisma.emailLog.findMany({ orderBy: { sentAt: "desc" }, take: 25 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Owner console</h1>
        <p className="mt-1 text-night/70">
          Full control of the sandlot: promote managers, oversee every game,
          and audit outgoing email.
        </p>
      </div>

      {/* Users & roles */}
      <section className="rounded-2xl bg-chalk p-6 shadow">
        <h2 className="mb-1 text-xl font-black">People ({users.length})</h2>
        <p className="mb-4 text-sm text-night/60">
          Owners control everything including roles. Managers can schedule and
          run games. You can&rsquo;t change your own role — ask another owner.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-night/60">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Kids</th>
                <th className="px-2 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="odd:bg-sand">
                  <td className="px-2 py-2 font-semibold">
                    {u.name}
                    {u.id === admin.id && (
                      <span className="ml-1 text-xs text-night/50">(you)</span>
                    )}
                  </td>
                  <td className="px-2 py-2">{u.email}</td>
                  <td className="px-2 py-2">{u._count.kids}</td>
                  <td className="px-2 py-2">
                    <RoleSelect
                      userId={u.id}
                      role={u.role}
                      disabled={u.id === admin.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All games */}
      <section className="rounded-2xl bg-chalk p-6 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">All games</h2>
          <Link
            href="/games/new"
            className="rounded-full bg-field px-4 py-1.5 text-sm font-bold text-chalk hover:bg-field-dark"
          >
            + Schedule a game
          </Link>
        </div>
        {games.length === 0 ? (
          <p className="text-night/70">No games yet.</p>
        ) : (
          <ul className="divide-y divide-night/10">
            {games.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/games/${g.id}`}
                    className="font-semibold text-field underline"
                  >
                    {formatShortDate(g.date)} · {formatTime(g.startTime)}
                  </Link>
                  <span className="text-night/60">{g.location.name}</span>
                  <GameStatusBadge status={g.status} />
                  <span className="text-xs text-night/50">
                    {g._count.signups} signed up
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  {g.status !== "CANCELLED" && g.status !== "COMPLETED" && (
                    <form action={cancelGame.bind(null, g.id)}>
                      <button type="submit" className="text-amber-700 underline">
                        Cancel
                      </button>
                    </form>
                  )}
                  <form action={deleteGame.bind(null, g.id)}>
                    <button type="submit" className="text-red-600 underline">
                      Delete forever
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Email audit log */}
      <section className="rounded-2xl bg-chalk p-6 shadow">
        <h2 className="mb-1 text-xl font-black">Email log</h2>
        <p className="mb-4 text-sm text-night/60">
          The 25 most recent emails. &ldquo;Logged&rdquo; means no SMTP server is
          configured, so the email was recorded here instead of delivered.
        </p>
        {emails.length === 0 ? (
          <p className="text-night/70">No emails sent yet.</p>
        ) : (
          <ul className="divide-y divide-night/10 text-sm">
            {emails.map((e) => (
              <li key={e.id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      e.delivered
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {e.delivered ? "Delivered" : "Logged"}
                  </span>
                  <span className="font-semibold">{e.subject}</span>
                  <span className="text-night/50">→ {e.to}</span>
                  <span className="text-xs text-night/40">
                    {e.sentAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
