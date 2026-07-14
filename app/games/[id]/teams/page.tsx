import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { TeamBuilder } from "@/components/TeamBuilder";
import { isStaff, MIN_PLAYERS_PER_TEAM } from "@/lib/constants";
import { formatGameDate, kidName } from "@/lib/format";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      signups: { include: { kid: true }, orderBy: { createdAt: "asc" } },
      teams: {
        include: { players: true, coaches: true },
        orderBy: { side: "desc" },
      },
    },
  });
  if (!game) notFound();

  const isCoach = game.teams.some((t) =>
    t.coaches.some((c) => c.userId === user.id)
  );
  if (!isStaff(user.role) && !isCoach) redirect(`/games/${id}`);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/games/${id}`} className="text-sm font-semibold text-field underline">
          ← Back to game
        </Link>
        <h1 className="mt-1 text-3xl font-black">
          Build teams — {formatGameDate(game.date)}
        </h1>
        <p className="mt-1 text-night/70">
          Split the {game.signups.length} signed-up players into two sides (at
          least {MIN_PLAYERS_PER_TEAM} each). Teams only exist for this game.
        </p>
      </div>

      <TeamBuilder
        gameId={game.id}
        kids={game.signups.map((s) => ({ id: s.kidId, name: kidName(s.kid) }))}
        teams={game.teams.map((t) => ({
          id: t.id,
          name: t.name,
          side: t.side,
          kidIds: t.players.map((p) => p.kidId),
        }))}
      />

      <div className="flex gap-4">
        {game.teams.map((t) => (
          <Link
            key={t.id}
            href={`/games/${id}/lineup/${t.id}`}
            className="rounded-full bg-field px-4 py-2 text-sm font-bold text-chalk hover:bg-field-dark"
          >
            Set {t.name} lineup →
          </Link>
        ))}
      </div>
    </div>
  );
}
