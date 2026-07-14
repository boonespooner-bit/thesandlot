import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GameStatusBadge } from "@/components/GameStatusBadge";
import {
  AddVolunteerForm,
  SignupKidsForm,
  VolunteerCoachForm,
} from "@/components/GameForms";
import { withdrawSignup } from "@/app/actions/signups";
import { cancelGame, removeVolunteer, withdrawAsCoach } from "@/app/actions/games";
import {
  isStaff,
  MAX_COACHES_PER_TEAM,
  MAX_VOLUNTEERS_PER_GAME,
  MIN_PLAYERS_TOTAL,
} from "@/lib/constants";
import { formatGameDate, formatTime, kidName } from "@/lib/format";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      location: true,
      signups: {
        include: { kid: { include: { parents: true } }, parent: true },
        orderBy: { createdAt: "asc" },
      },
      teams: {
        include: {
          coaches: { include: { user: true } },
          players: { include: { kid: true } },
        },
        orderBy: { side: "desc" }, // HOME first
      },
      volunteers: true,
    },
  });
  if (!game) notFound();

  const myKids = user
    ? await prisma.parentKid.findMany({
        where: { parentId: user.id },
        include: { kid: true },
      })
    : [];

  const signedUpKidIds = new Set(game.signups.map((s) => s.kidId));
  const playerCount = game.signups.length;
  const pct = Math.min(100, Math.round((playerCount / MIN_PLAYERS_TOTAL) * 100));
  const isManager = !!user && isStaff(user.role);
  const isCoach = !!user && game.teams.some((t) =>
    t.coaches.some((c) => c.userId === user.id)
  );
  const canManageGame = isManager || isCoach;
  const signupsOpen = game.status === "OPEN" || game.status === "CONFIRMED";

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-3xl bg-field p-8 text-chalk shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">{formatGameDate(game.date)}</h1>
            <p className="mt-1 text-lg text-chalk/90">
              {formatTime(game.startTime)} · {game.location.name}
              {game.location.address && (
                <span className="text-chalk/70"> — {game.location.address}</span>
              )}
            </p>
            {game.notes && <p className="mt-2 text-chalk/80">{game.notes}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <GameStatusBadge status={game.status} />
            {isManager && game.status !== "CANCELLED" && (
              <form action={cancelGame.bind(null, game.id)}>
                <button
                  type="submit"
                  className="text-xs font-semibold text-chalk/70 underline hover:text-chalk"
                >
                  Cancel game
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-1 flex justify-between text-sm font-semibold">
            <span>
              {playerCount} / {MIN_PLAYERS_TOTAL} players signed up
            </span>
            <span>
              {playerCount >= MIN_PLAYERS_TOTAL
                ? "Game confirmed — play ball!"
                : `${MIN_PLAYERS_TOTAL - playerCount} more to confirm`}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-night/30">
            <div
              className={`h-full rounded-full ${pct >= 100 ? "bg-dirt" : "bg-chalk/80"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Sign up kids */}
      {signupsOpen && (
        <section className="rounded-2xl bg-chalk p-6 shadow">
          <h2 className="mb-3 text-xl font-black">Sign up your kids</h2>
          {user ? (
            <SignupKidsForm
              gameId={game.id}
              kids={myKids.map((l) => ({
                id: l.kidId,
                name: kidName(l.kid),
                signedUp: signedUpKidIds.has(l.kidId),
              }))}
            />
          ) : (
            <p className="text-night/70">
              <Link href="/login" className="font-semibold text-field underline">
                Log in
              </Link>{" "}
              or{" "}
              <Link href="/register" className="font-semibold text-field underline">
                create an account
              </Link>{" "}
              to sign your kids up for this game.
            </p>
          )}
        </section>
      )}

      {/* Roster */}
      <section className="rounded-2xl bg-chalk p-6 shadow">
        <h2 className="mb-3 text-xl font-black">
          Players signed up ({playerCount})
        </h2>
        {game.signups.length === 0 ? (
          <p className="text-night/70">Nobody yet — be the first!</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {game.signups.map((s) => {
              const mine =
                !!user && s.kid.parents.some((p) => p.parentId === user.id);
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 odd:bg-sand"
                >
                  <span>
                    <span className="font-semibold">{kidName(s.kid)}</span>{" "}
                    <span className="text-xs text-night/60">
                      (signed up by {s.parent.name})
                    </span>
                  </span>
                  {(mine || isManager) && (
                    <form action={withdrawSignup.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="text-xs font-semibold text-red-600 underline"
                      >
                        Withdraw
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Teams & coaches */}
      <section className="rounded-2xl bg-chalk p-6 shadow">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">Teams &amp; coaches</h2>
          {canManageGame && (
            <Link
              href={`/games/${game.id}/teams`}
              className="rounded-full bg-field px-4 py-1.5 text-sm font-bold text-chalk hover:bg-field-dark"
            >
              Build teams
            </Link>
          )}
        </div>
        <p className="mb-4 text-sm text-night/60">
          Teams are rebuilt fresh for every game. Each team needs{" "}
          {MAX_COACHES_PER_TEAM} parent coaches.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {game.teams.map((team) => (
            <div key={team.id} className="rounded-xl border border-night/10 bg-sand p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black">
                  {team.name}{" "}
                  <span className="text-xs font-semibold text-night/50">
                    ({team.side === "HOME" ? "Home" : "Away"})
                  </span>
                </h3>
                {canManageGame && team.players.length > 0 && (
                  <Link
                    href={`/games/${game.id}/lineup/${team.id}`}
                    className="text-sm font-semibold text-field underline"
                  >
                    Lineup
                  </Link>
                )}
              </div>
              <div className="mt-2 text-sm">
                <div className="font-semibold text-night/70">
                  Coaches ({team.coaches.length}/{MAX_COACHES_PER_TEAM}):
                </div>
                {team.coaches.length === 0 ? (
                  <p className="text-night/50">No coaches yet.</p>
                ) : (
                  <ul>
                    {team.coaches.map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        🧢 {c.user.name}
                        {user?.id === c.userId && (
                          <form action={withdrawAsCoach.bind(null, game.id)}>
                            <button
                              type="submit"
                              className="text-xs text-red-600 underline"
                            >
                              step down
                            </button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-2 text-sm">
                <div className="font-semibold text-night/70">
                  Players ({team.players.length}):
                </div>
                {team.players.length === 0 ? (
                  <p className="text-night/50">Not picked yet.</p>
                ) : (
                  <p>{team.players.map((p) => p.kid.firstName).join(", ")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        {user && signupsOpen && (
          <div className="mt-4">
            <VolunteerCoachForm
              gameId={game.id}
              teams={game.teams.map((t) => ({
                id: t.id,
                name: t.name,
                openSpots: t.coaches.some((c) => c.userId === user.id)
                  ? 0
                  : MAX_COACHES_PER_TEAM - t.coaches.length,
              }))}
            />
          </div>
        )}
      </section>

      {/* Volunteers */}
      <section className="rounded-2xl bg-chalk p-6 shadow">
        <h2 className="mb-1 text-xl font-black">Umpire &amp; pitcher volunteers</h2>
        <p className="mb-4 text-sm text-night/60">
          Up to {MAX_VOLUNTEERS_PER_GAME} extra helpers per game — usually high
          school players who ump the bases or pitch to both teams.
        </p>
        {game.volunteers.length === 0 ? (
          <p className="mb-3 text-night/70">No volunteers yet.</p>
        ) : (
          <ul className="mb-3 space-y-1">
            {game.volunteers.map((v) => (
              <li key={v.id} className="flex items-center gap-2">
                <span className="font-semibold">
                  {v.role === "UMPIRE" ? "🧑‍⚖️" : "🥎"} {v.name}
                </span>
                <span className="text-xs uppercase text-night/50">{v.role.toLowerCase()}</span>
                {v.phone && <span className="text-xs text-night/50">{v.phone}</span>}
                {canManageGame && (
                  <form action={removeVolunteer.bind(null, v.id, game.id)}>
                    <button type="submit" className="text-xs text-red-600 underline">
                      remove
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {user &&
          signupsOpen &&
          game.volunteers.length < MAX_VOLUNTEERS_PER_GAME && (
            <AddVolunteerForm gameId={game.id} />
          )}
      </section>
    </div>
  );
}
