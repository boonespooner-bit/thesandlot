import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LineupEditor } from "@/components/LineupEditor";
import { activePositionsFor, MIN_PLAYERS_PER_TEAM } from "@/lib/constants";
import { formatGameDate } from "@/lib/format";

export default async function LineupPage({
  params,
}: {
  params: Promise<{ id: string; teamId: string }>;
}) {
  const { id, teamId } = await params;
  const user = await requireUser();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      game: { include: { location: true, coaches: true } },
      players: { include: { kid: true }, orderBy: { kid: { firstName: "asc" } } },
      assignments: true,
      coaches: { include: { user: true } },
    },
  });
  if (!team || team.gameId !== id) notFound();

  const isCoach = team.game.coaches.some((c) => c.userId === user.id);
  if (user.role !== "MANAGER" && !isCoach) redirect(`/games/${id}`);

  const players = team.players.map((p) => p.kid);
  const activePositions = activePositionsFor(players.length);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/games/${id}`} className="text-sm font-semibold text-field underline">
          ← Back to game
        </Link>
        <h1 className="mt-1 text-3xl font-black">
          {team.name} lineup — {formatGameDate(team.game.date)}
        </h1>
        <p className="mt-1 text-night/70">
          6 innings at {team.game.location.name}.{" "}
          {team.coaches.length > 0 && (
            <>Coaches: {team.coaches.map((c) => c.user.name).join(" & ")}. </>
          )}
          {players.length < MIN_PLAYERS_PER_TEAM &&
            `Heads up: only ${players.length} players — a full side is ${MIN_PLAYERS_PER_TEAM}.`}
        </p>
      </div>

      {players.length === 0 ? (
        <p className="rounded-2xl bg-chalk p-6 text-night/70 shadow">
          No players on this team yet.{" "}
          <Link
            href={`/games/${id}/teams`}
            className="font-semibold text-field underline"
          >
            Build the teams first →
          </Link>
        </p>
      ) : (
        <LineupEditor
          teamId={team.id}
          players={players.map((k) => ({
            id: k.id,
            firstName: k.firstName,
            lastName: k.lastName,
          }))}
          assignments={team.assignments.map((a) => ({
            kidId: a.kidId,
            inning: a.inning,
            position: a.position,
          }))}
          activePositions={activePositions}
        />
      )}
    </div>
  );
}
