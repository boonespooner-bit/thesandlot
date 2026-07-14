"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// Team building is open to the game's coaches and to managers.
async function requireTeamEditor(gameId: string) {
  const user = await requireUser();
  if (user.role === "MANAGER") return user;
  const coach = await prisma.gameCoach.findUnique({
    where: { gameId_userId: { gameId, userId: user.id } },
  });
  if (!coach) throw new Error("Only coaches and managers can edit teams.");
  return user;
}

export async function assignKidToTeam(
  gameId: string,
  kidId: string,
  teamId: string | null
) {
  await requireTeamEditor(gameId);

  const teams = await prisma.team.findMany({ where: { gameId } });
  const teamIds = teams.map((t) => t.id);

  // The kid must actually be signed up for this game.
  const signup = await prisma.signup.findUnique({
    where: { gameId_kidId: { gameId, kidId } },
  });
  if (!signup) return;

  const ops = [
    // A kid can be on only one team per game; moving also clears their lineup.
    prisma.teamPlayer.deleteMany({ where: { kidId, teamId: { in: teamIds } } }),
    prisma.inningAssignment.deleteMany({
      where: { kidId, teamId: { in: teamIds } },
    }),
  ];
  if (teamId) {
    if (!teamIds.includes(teamId)) return;
    ops.push(prisma.teamPlayer.create({ data: { teamId, kidId } }) as never);
  }
  await prisma.$transaction(ops);

  revalidatePath(`/games/${gameId}`);
  revalidatePath(`/games/${gameId}/teams`);
}

/** Deal signed-up kids alternately onto the two teams (snake order). */
export async function autoBalanceTeams(gameId: string) {
  await requireTeamEditor(gameId);

  const [teams, signups] = await Promise.all([
    prisma.team.findMany({ where: { gameId }, orderBy: { side: "desc" } }), // HOME first
    prisma.signup.findMany({
      where: { gameId },
      include: { kid: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (teams.length !== 2) return;

  const teamIds = teams.map((t) => t.id);
  await prisma.$transaction([
    prisma.inningAssignment.deleteMany({ where: { teamId: { in: teamIds } } }),
    prisma.teamPlayer.deleteMany({ where: { teamId: { in: teamIds } } }),
    prisma.teamPlayer.createMany({
      data: signups.map((s, i) => ({
        teamId: teamIds[i % 2],
        kidId: s.kidId,
      })),
    }),
  ]);

  revalidatePath(`/games/${gameId}`);
  revalidatePath(`/games/${gameId}/teams`);
}
