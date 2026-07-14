"use client";

import { useState, useTransition } from "react";
import {
  clearLineup,
  generateLineup,
  setAssignment,
} from "@/app/actions/lineup";
import {
  BENCH,
  INNINGS,
  POSITION_LABELS,
  type Position,
} from "@/lib/constants";

type Player = { id: string; firstName: string; lastName: string };
type Assignment = { kidId: string; inning: number; position: string };

// Where each position sits on the diamond, as % of the SVG viewbox.
const SPOTS: Record<Position, { x: number; y: number }> = {
  P: { x: 50, y: 62 },
  C: { x: 50, y: 88 },
  "1B": { x: 72, y: 56 },
  "2B": { x: 62, y: 40 },
  SS: { x: 38, y: 40 },
  "3B": { x: 28, y: 56 },
  LF: { x: 18, y: 24 },
  CF: { x: 50, y: 12 },
  RF: { x: 82, y: 24 },
};

export function LineupEditor({
  teamId,
  players,
  assignments,
  activePositions,
}: {
  teamId: string;
  players: Player[];
  assignments: Assignment[];
  activePositions: Position[];
}) {
  const [inning, setInning] = useState(1);
  const [pending, startTransition] = useTransition();

  const byKidInning = new Map<string, string>();
  for (const a of assignments) byKidInning.set(`${a.kidId}:${a.inning}`, a.position);

  const byPositionThisInning = new Map<string, Player>();
  for (const p of players) {
    const pos = byKidInning.get(`${p.id}:${inning}`);
    if (pos && pos !== BENCH) byPositionThisInning.set(pos, p);
  }
  const benched = players.filter(
    (p) => byKidInning.get(`${p.id}:${inning}`) === BENCH
  );
  const unset = players.filter((p) => !byKidInning.get(`${p.id}:${inning}`));

  const update = (kidId: string, inn: number, position: string) =>
    startTransition(() => setAssignment(teamId, kidId, inn, position));

  return (
    <div className={`space-y-6 ${pending ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => startTransition(() => generateLineup(teamId))}
          className="rounded-full bg-dirt px-4 py-2 text-sm font-bold text-night hover:brightness-110"
        >
          ✨ Auto-generate fair lineup
        </button>
        <button
          onClick={() => startTransition(() => clearLineup(teamId))}
          className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
        >
          Clear all
        </button>
        <span className="text-sm text-night/60">
          Rotates positions every inning and spreads bench time evenly — then
          tweak any cell by hand.
        </span>
      </div>

      {/* Inning tabs + diamond */}
      <div className="rounded-2xl bg-chalk p-4 shadow">
        <div className="mb-3 flex flex-wrap gap-2">
          {INNINGS.map((i) => (
            <button
              key={i}
              onClick={() => setInning(i)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                inning === i
                  ? "bg-field text-chalk"
                  : "bg-sand text-night hover:bg-dirt/40"
              }`}
            >
              Inning {i}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-lg">
          <svg viewBox="0 0 100 100" className="w-full rounded-xl">
            {/* grass */}
            <rect x="0" y="0" width="100" height="100" fill="#2f7d3b" rx="3" />
            {/* outfield arc */}
            <path d="M 2 98 Q 50 -30 98 98 Z" fill="#3c9149" />
            {/* infield dirt */}
            <path
              d="M 50 92 L 78 64 Q 50 30 22 64 Z"
              fill="#c8965a"
            />
            {/* base diamond */}
            <path
              d="M 50 88 L 70 68 L 50 48 L 30 68 Z"
              fill="#3c9149"
              stroke="#fffdf6"
              strokeWidth="0.8"
            />
            {/* mound + bases */}
            <circle cx="50" cy="68" r="3.4" fill="#c8965a" />
            {(
              [
                [50, 88],
                [70, 68],
                [50, 48],
                [30, 68],
              ] as const
            ).map(([x, y], i) => (
              <rect
                key={i}
                x={x - 1.6}
                y={y - 1.6}
                width="3.2"
                height="3.2"
                fill="#fffdf6"
                transform={`rotate(45 ${x} ${y})`}
              />
            ))}
            {/* players */}
            {activePositions.map((pos) => {
              const spot = SPOTS[pos];
              const player = byPositionThisInning.get(pos);
              return (
                <g key={pos}>
                  <circle
                    cx={spot.x}
                    cy={spot.y}
                    r="4.5"
                    fill={player ? "#fffdf6" : "rgba(255,253,246,0.35)"}
                    stroke="#1d2a1f"
                    strokeWidth="0.4"
                  />
                  <text
                    x={spot.x}
                    y={spot.y + 1.1}
                    textAnchor="middle"
                    fontSize="3"
                    fontWeight="bold"
                    fill="#1d2a1f"
                  >
                    {pos}
                  </text>
                  <text
                    x={spot.x}
                    y={spot.y + 8}
                    textAnchor="middle"
                    fontSize="3.4"
                    fontWeight="bold"
                    fill="#fffdf6"
                    stroke="#1d2a1f"
                    strokeWidth="0.12"
                  >
                    {player ? player.firstName : "—"}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold">Bench (inning {inning}):</span>
            {benched.length === 0 ? (
              <span className="text-night/50">nobody</span>
            ) : (
              benched.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full bg-sand px-2.5 py-0.5 font-semibold"
                >
                  {p.firstName}
                </span>
              ))
            )}
            {unset.length > 0 && (
              <span className="text-night/50">
                · not set: {unset.map((p) => p.firstName).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full 6-inning grid */}
      <div className="overflow-x-auto rounded-2xl bg-chalk p-4 shadow">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-2 font-black">Player</th>
              {INNINGS.map((i) => (
                <th
                  key={i}
                  className={`px-2 py-2 text-center font-black ${
                    i === inning ? "text-field" : ""
                  }`}
                >
                  {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="odd:bg-sand">
                <td className="px-2 py-1.5 font-semibold">
                  {p.firstName} {p.lastName}
                </td>
                {INNINGS.map((i) => {
                  const value = byKidInning.get(`${p.id}:${i}`) ?? "";
                  return (
                    <td key={i} className="px-1 py-1.5 text-center">
                      <select
                        value={value}
                        onChange={(e) => update(p.id, i, e.target.value)}
                        className={`w-20 rounded border px-1 py-1 text-center text-xs font-semibold ${
                          value === BENCH
                            ? "border-amber-300 bg-amber-50"
                            : value
                              ? "border-field/40 bg-green-50"
                              : "border-night/20 bg-chalk"
                        }`}
                      >
                        <option value="">—</option>
                        {activePositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                        <option value={BENCH}>Bench</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-night/50">
          Positions: {activePositions.map((p) => `${p} = ${POSITION_LABELS[p]}`).join(" · ")}.
          Picking a position that&rsquo;s already taken that inning moves the other
          player to the bench.
        </p>
      </div>
    </div>
  );
}
