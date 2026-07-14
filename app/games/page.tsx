import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GameCard } from "@/components/GameCard";
import { isStaff } from "@/lib/constants";

export default async function GamesPage() {
  const user = await getCurrentUser();
  const today = new Date(new Date().toDateString());

  const [upcoming, past] = await Promise.all([
    prisma.game.findMany({
      where: { date: { gte: today } },
      include: { location: true, _count: { select: { signups: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.game.findMany({
      where: { date: { lt: today } },
      include: { location: true, _count: { select: { signups: true } } },
      orderBy: { date: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Games</h1>
        {user && isStaff(user.role) && (
          <Link
            href="/games/new"
            className="rounded-full bg-field px-4 py-2 font-bold text-chalk hover:bg-field-dark"
          >
            + Schedule a game
          </Link>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-xl font-black">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl bg-chalk p-6 text-night/70 shadow">
            No upcoming games.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-black">Past games</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
