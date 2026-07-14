"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  BENCH,
  INNINGS,
  activePositionsFor,
} from "@/lib/constants";

async function requireLineupEditor(gameId: string) {
  const user = await requireUser();
  if (user.role === "MANAGER") return user;
  const coach = await prisma.gameCoach.findUnique({
    where: { gameId_userId: { gameId, userId: user.id } },
  });
  if (!coach) throw new Error("Only coaches and managers can edit lineups.");
  return user;
}

export async function setAssignment(
  teamId: string,
  kidId: string,
  inning: number,
  position: string // "" clears the cell
) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return;
  await requireLineupEditor(team.gameId);

  if (!position) {
    await prisma.inningAssignment.deleteMany({
      where: { teamId, kidId, inning },
    });
  } else {
    // One kid per position per inning: whoever held this spot moves to bench.
    if (position !== BENCH) {
      await prisma.inningAssignment.updateMany({
        where: { teamId, inning, position, NOT: { kidId } },
        data: { position: BENCH },
      });
    }
    await prisma.inningAssignment.upsert({
      where: { teamId_kidId_inning: { teamId, kidId, inning } },
      update: { position },
      create: { teamId, kidId, inning, position },
    });
  }

  revalidatePath(`/games/${team.gameId}/lineup/${teamId}`);
}

/**
 * Auto-generate a fair 6-inning lineup, in the spirit of EasyGameManager:
 * every position filled every inning, bench time spread evenly and kept
 * non-consecutive, and players rotated through different positions.
 */
export async function generateLineup(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { players: { include: { kid: true } } },
  });
  if (!team) return;
  await requireLineupEditor(team.gameId);

  const kids = team.players.map((p) => p.kidId);
  const n = kids.length;
  if (n === 0) return;

  const positions = activePositionsFor(n);
  const benchPerInning = Math.max(0, n - positions.length);

  const rows: { teamId: string; kidId: string; inning: number; position: string }[] =
    [];
  let benchPointer = 0;

  for (const inning of INNINGS) {
    // Round-robin bench: the pointer advances so bench turns rotate through
    // the whole roster, which spreads bench innings evenly and keeps any
    // player's bench innings non-consecutive when the roster is big enough.
    const benched = new Set<string>();
    for (let b = 0; b < benchPerInning; b++) {
      benched.add(kids[(benchPointer + b) % n]);
    }
    benchPointer = (benchPointer + benchPerInning) % Math.max(1, n);

    const fielders = kids.filter((k) => !benched.has(k));
    fielders.forEach((kidId, idx) => {
      // Shift positions every inning so kids rotate around the diamond.
      const pos = positions[(idx + inning - 1) % positions.length];
      rows.push({ teamId, kidId, inning, position: pos });
    });
    for (const kidId of benched) {
      rows.push({ teamId, kidId, inning, position: BENCH });
    }
  }

  await prisma.$transaction([
    prisma.inningAssignment.deleteMany({ where: { teamId } }),
    prisma.inningAssignment.createMany({ data: rows }),
  ]);

  revalidatePath(`/games/${team.gameId}/lineup/${teamId}`);
}

export async function clearLineup(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return;
  await requireLineupEditor(team.gameId);

  await prisma.inningAssignment.deleteMany({ where: { teamId } });
  revalidatePath(`/games/${team.gameId}/lineup/${teamId}`);
}
