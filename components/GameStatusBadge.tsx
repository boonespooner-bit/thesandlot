import { GAME_STATUS_LABELS } from "@/lib/constants";

const STYLES: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800 border-amber-300",
  CONFIRMED: "bg-green-100 text-green-800 border-green-300",
  CANCELLED: "bg-red-100 text-red-700 border-red-300",
  COMPLETED: "bg-slate-100 text-slate-600 border-slate-300",
};

export function GameStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${STYLES[status] ?? STYLES.OPEN}`}
    >
      {GAME_STATUS_LABELS[status] ?? status}
    </span>
  );
}
