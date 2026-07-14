// Domain constants for The Sandlot.

export const INNINGS = [1, 2, 3, 4, 5, 6] as const;
export const TOTAL_INNINGS = 6;

// Minimum players for a confirmed game: 7 per team, 14 total.
export const MIN_PLAYERS_PER_TEAM = 7;
export const MIN_PLAYERS_TOTAL = MIN_PLAYERS_PER_TEAM * 2;

export const MAX_COACHES_PER_TEAM = 2;
export const MAX_VOLUNTEERS_PER_GAME = 2;

export const POSITIONS = [
  "P",
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "LF",
  "CF",
  "RF",
] as const;
export type Position = (typeof POSITIONS)[number];

export const BENCH = "BENCH";

export const POSITION_LABELS: Record<string, string> = {
  P: "Pitcher",
  C: "Catcher",
  "1B": "First Base",
  "2B": "Second Base",
  "3B": "Third Base",
  SS: "Shortstop",
  LF: "Left Field",
  CF: "Center Field",
  RF: "Right Field",
  BENCH: "Bench",
};

// With a short sandlot roster we fill the most important spots first.
// A 7-player side fields P C 1B 2B 3B SS CF; 8 adds LF; 9 adds RF.
export const POSITION_PRIORITY: Position[] = [
  "P",
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "CF",
  "LF",
  "RF",
];

export function activePositionsFor(teamSize: number): Position[] {
  const n = Math.min(POSITIONS.length, Math.max(0, teamSize));
  return POSITION_PRIORITY.slice(0, n);
}

// Home wears light shirts, away wears dark shirts.
export const DEFAULT_TEAM_NAMES: Record<string, string> = {
  HOME: "Light Shirts",
  AWAY: "Dark Shirts",
};

export const VOLUNTEER_ROLES = ["UMPIRE", "PITCHER"] as const;

// Role hierarchy: ADMIN (owner) > MANAGER > PARENT.
// Staff (managers and the owner) can schedule games, build teams and lineups.
export function isStaff(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

export function isAdmin(role: string) {
  return role === "ADMIN";
}

export const ROLE_LABELS: Record<string, string> = {
  PARENT: "Parent",
  MANAGER: "Manager",
  ADMIN: "Owner",
};

export const GAME_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open for signups",
  CONFIRMED: "Game on!",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};
