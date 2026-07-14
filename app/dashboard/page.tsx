import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { GameCard } from "@/components/GameCard";
import { GameStatusBadge } from "@/components/GameStatusBadge";
import { withdrawSignup } from "@/app/actions/signups";
import { formatShortDate, formatTime, kidName } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = new Date(new Date().toDateString());

  const [links, myGamesSignups, coachSpots, upcoming] = await Promise.all([
    prisma.parentKid.findMany({
      where: { parentId: user.id },
      include: { kid: true },
    }),
    prisma.signup.findMany({
      where: {
        kid: { parents: { some: { parentId: user.id } } },
        game: { date: { gte: today } },
      },
      include: { kid: true, game: { include: { location: true } } },
      orderBy: { game: { date: "asc" } },
    }),
    prisma.gameCoach.findMany({
      where: { userId: user.id, game: { date: { gte: today } } },
      include: { team: true, game: { include: { location: true } } },
    }),
    prisma.game.findMany({
      where: { date: { gte: today }, status: { not: "CANCELLED" } },
      include: { location: true, _count: { select: { signups: true } } },
      orderBy: { date: "asc" },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Hey, {user.name.split(" ")[0]}!</h1>
        {user.role === "MANAGER" && (
          <Link
            href="/games/new"
            className="rounded-full bg-field px-4 py-2 font-bold text-chalk hover:bg-field-dark"
          >
            + Schedule a game
          </Link>
        )}
      </div>

      <section className="rounded-2xl bg-chalk p-6 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Your kids</h2>
          <Link href="/kids" className="text-sm font-semibold text-field underline">
            Manage kids
          </Link>
        </div>
        {links.length === 0 ? (
          <p className="text-night/70">
            No kids yet —{" "}
            <Link href="/kids" className="font-semibold text-field underline">
              add your first kid
            </Link>{" "}
            to get them on the roster.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {links.map((l) => (
              <li
                key={l.kidId}
                className="rounded-full bg-sand px-3 py-1 text-sm font-semibold"
              >
                {kidName(l.kid)}
                {l.kid.birthYear ? ` (b. ${l.kid.birthYear})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-chalk p-6 shadow">
        <h2 className="mb-3 text-xl font-black">Upcoming signups</h2>
        {myGamesSignups.length === 0 ? (
          <p className="text-night/70">
            None yet — find a game below and sign your kids up.
          </p>
        ) : (
          <ul className="divide-y divide-night/10">
            {myGamesSignups.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <span className="font-bold">{kidName(s.kid)}</span>{" "}
                  <span className="text-night/70">
                    — {formatShortDate(s.game.date)} at{" "}
                    {formatTime(s.game.startTime)}, {s.game.location.name}
                  </span>{" "}
                  <GameStatusBadge status={s.game.status} />
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/games/${s.gameId}`}
                    className="text-sm font-semibold text-field underline"
                  >
                    View
                  </Link>
                  <form
                    action={withdrawSignup.bind(null, s.id)}
                  >
                    <button
                      type="submit"
                      className="text-sm font-semibold text-red-600 underline"
                    >
                      Withdraw
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {coachSpots.length > 0 && (
        <section className="rounded-2xl bg-chalk p-6 shadow">
          <h2 className="mb-3 text-xl font-black">You&rsquo;re coaching</h2>
          <ul className="divide-y divide-night/10">
            {coachSpots.map((c) => (
              <li key={c.id} className="py-3">
                <Link href={`/games/${c.gameId}`} className="font-semibold text-field underline">
                  {c.team.name}
                </Link>{" "}
                <span className="text-night/70">
                  — {formatShortDate(c.game.date)} at {c.game.location.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-black">Next games</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl bg-chalk p-6 text-night/70 shadow">
            Nothing on the calendar yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {upcoming.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
