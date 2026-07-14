import Link from "next/link";
import { GameStatusBadge } from "@/components/GameStatusBadge";
import { MIN_PLAYERS_TOTAL } from "@/lib/constants";
import { formatGameDate, formatTime } from "@/lib/format";

type GameForCard = {
  id: string;
  date: Date;
  startTime: string;
  status: string;
  location: { name: string };
  _count: { signups: number };
};

export function GameCard({ game }: { game: GameForCard }) {
  const pct = Math.min(
    100,
    Math.round((game._count.signups / MIN_PLAYERS_TOTAL) * 100)
  );
  return (
    <Link
      href={`/games/${game.id}`}
      className="block rounded-2xl bg-chalk p-5 shadow transition hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold">{formatGameDate(game.date)}</div>
          <div className="text-sm text-night/70">
            {formatTime(game.startTime)} · {game.location.name}
          </div>
        </div>
        <GameStatusBadge status={game.status} />
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs font-semibold text-night/60">
          <span>
            {game._count.signups} / {MIN_PLAYERS_TOTAL} players
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-night/10">
          <div
            className={`h-full rounded-full ${pct >= 100 ? "bg-field" : "bg-dirt"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
