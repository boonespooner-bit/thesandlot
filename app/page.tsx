import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GameCard } from "@/components/GameCard";
import { MIN_PLAYERS_PER_TEAM, MIN_PLAYERS_TOTAL } from "@/lib/constants";

export default async function HomePage() {
  const user = await getCurrentUser();
  const upcoming = await prisma.game.findMany({
    where: {
      date: { gte: new Date(new Date().toDateString()) },
      status: { not: "CANCELLED" },
    },
    include: { location: true, _count: { select: { signups: true } } },
    orderBy: { date: "asc" },
    take: 6,
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-field p-10 text-chalk shadow-lg">
        <h1 className="text-4xl font-black sm:text-5xl">
          Pickup baseball, the way it should be.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-chalk/90">
          Pick a date. Pick a field. Sign your kids up. When {MIN_PLAYERS_TOTAL}{" "}
          players are in — {MIN_PLAYERS_PER_TEAM} a side — the game is on.
          Parents coach, high schoolers ump and pitch, kids play ball.
        </p>
        <div className="mt-6 flex gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-dirt px-5 py-2.5 font-bold text-night hover:brightness-110"
            >
              Go to your dashboard
            </Link>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-dirt px-5 py-2.5 font-bold text-night hover:brightness-110"
            >
              Sign up your kids
            </Link>
          )}
          <Link
            href="/games"
            className="rounded-full border border-chalk/50 px-5 py-2.5 font-bold hover:bg-field-dark"
          >
            See all games
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black">Upcoming games</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl bg-chalk p-6 text-night/70 shadow">
            No games scheduled yet. Check back soon!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "1. Add your kids",
            body: "Kids are the players. Make your parent account, add your kids once, and they stay on the roster.",
          },
          {
            title: "2. Sign up for a game",
            body: `Each game has one date, one field, one start time. The game is confirmed at ${MIN_PLAYERS_TOTAL} players.`,
          },
          {
            title: "3. Play ball",
            body: "Two parent coaches per team build fresh teams each game and set positions for all 6 innings.",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl bg-chalk p-6 shadow">
            <h3 className="mb-2 font-black">{c.title}</h3>
            <p className="text-sm text-night/70">{c.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
