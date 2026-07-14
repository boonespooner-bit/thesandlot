"use client";

import { useTransition } from "react";
import { assignKidToTeam, autoBalanceTeams } from "@/app/actions/teams";

type Kid = { id: string; name: string };
type Team = { id: string; name: string; side: string; kidIds: string[] };

export function TeamBuilder({
  gameId,
  kids,
  teams,
}: {
  gameId: string;
  kids: Kid[];
  teams: Team[];
}) {
  const [pending, startTransition] = useTransition();

  const assignment = new Map<string, string>(); // kidId -> teamId
  for (const t of teams) for (const k of t.kidIds) assignment.set(k, t.id);
  const unassigned = kids.filter((k) => !assignment.has(k.id));

  const move = (kidId: string, teamId: string | null) =>
    startTransition(() => assignKidToTeam(gameId, kidId, teamId));

  return (
    <div className={pending ? "opacity-60" : ""}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => startTransition(() => autoBalanceTeams(gameId))}
          className="rounded-full bg-dirt px-4 py-2 text-sm font-bold text-night hover:brightness-110"
        >
          ⚖️ Auto-balance teams
        </button>
        <span className="text-sm text-night/60">
          Deals signed-up players alternately onto the two teams. You can then
          move anyone by hand.
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-chalk p-4 shadow">
          <h3 className="mb-2 font-black">Unassigned ({unassigned.length})</h3>
          {unassigned.length === 0 ? (
            <p className="text-sm text-night/50">Everyone has a team.</p>
          ) : (
            <ul className="space-y-2">
              {unassigned.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center justify-between rounded-lg bg-sand px-3 py-2 text-sm"
                >
                  <span className="font-semibold">{k.name}</span>
                  <span className="flex gap-1">
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => move(k.id, t.id)}
                        className="rounded-full bg-field px-2 py-0.5 text-xs font-bold text-chalk hover:bg-field-dark"
                        title={`Put on ${t.name}`}
                      >
                        → {t.side === "HOME" ? "Home" : "Away"}
                      </button>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {teams.map((team) => {
          const roster = kids.filter((k) => assignment.get(k.id) === team.id);
          const other = teams.find((t) => t.id !== team.id);
          return (
            <div key={team.id} className="rounded-2xl bg-chalk p-4 shadow">
              <h3 className="mb-2 font-black">
                {team.name}{" "}
                <span className="text-xs font-semibold text-night/50">
                  ({team.side === "HOME" ? "Home" : "Away"}, {roster.length}{" "}
                  players)
                </span>
              </h3>
              {roster.length === 0 ? (
                <p className="text-sm text-night/50">No players yet.</p>
              ) : (
                <ul className="space-y-2">
                  {roster.map((k) => (
                    <li
                      key={k.id}
                      className="flex items-center justify-between rounded-lg bg-sand px-3 py-2 text-sm"
                    >
                      <span className="font-semibold">{k.name}</span>
                      <span className="flex gap-1">
                        {other && (
                          <button
                            onClick={() => move(k.id, other.id)}
                            className="rounded-full bg-night/70 px-2 py-0.5 text-xs font-bold text-chalk hover:bg-night"
                          >
                            ⇄ swap side
                          </button>
                        )}
                        <button
                          onClick={() => move(k.id, null)}
                          className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 hover:bg-red-200"
                        >
                          ✕
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
