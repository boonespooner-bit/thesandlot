"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireManager, requireUser } from "@/lib/auth";
import { sendMany } from "@/lib/email";
import {
  DEFAULT_TEAM_NAMES,
  MAX_VOLUNTEERS_PER_GAME,
  VOLUNTEER_ROLES,
} from "@/lib/constants";
import { formatGameDate, formatTime } from "@/lib/format";

export type FormState = { error?: string } | undefined;

export async function createGame(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const manager = await requireManager();

  const dateRaw = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const locationId = String(formData.get("locationId") ?? "");
  const newLocationName = String(formData.get("newLocationName") ?? "").trim();
  const newLocationAddress =
    String(formData.get("newLocationAddress") ?? "").trim() || null;

  if (!dateRaw) return { error: "Pick a date for the game." };
  if (!startTime) return { error: "Pick a start time." };

  const date = new Date(`${dateRaw}T00:00:00.000Z`);
  const existing = await prisma.game.findUnique({ where: { date } });
  if (existing) {
    return { error: "There is already a game on that date — one game per day." };
  }

  let finalLocationId = locationId;
  if (locationId === "new") {
    if (!newLocationName) return { error: "Enter a name for the new field." };
    const loc = await prisma.location.create({
      data: { name: newLocationName, address: newLocationAddress },
    });
    finalLocationId = loc.id;
  }
  if (!finalLocationId) return { error: "Pick a location." };

  const game = await prisma.game.create({
    data: {
      date,
      startTime,
      notes,
      locationId: finalLocationId,
      createdById: manager.id,
      // Teams are created fresh for every game.
      teams: {
        create: [
          { side: "HOME", name: DEFAULT_TEAM_NAMES.HOME },
          { side: "AWAY", name: DEFAULT_TEAM_NAMES.AWAY },
        ],
      },
    },
  });

  revalidatePath("/games");
  revalidatePath("/");
  redirect(`/games/${game.id}`);
}

export async function cancelGame(gameId: string) {
  await requireManager();
  const game = await prisma.game.update({
    where: { id: gameId },
    data: { status: "CANCELLED" },
    include: {
      location: true,
      signups: { include: { parent: true, kid: true } },
    },
  });

  const seen = new Set<string>();
  const messages = game.signups
    .filter((s) => (seen.has(s.parent.email) ? false : seen.add(s.parent.email)))
    .map((s) => ({
      to: s.parent.email,
      subject: `Game cancelled — ${formatGameDate(game.date)}`,
      body: `The sandlot game on ${formatGameDate(game.date)} at ${game.location.name} has been cancelled.\n\n— The Sandlot`,
    }));
  await sendMany(messages);

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
}

export async function volunteerAsCoach(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const gameId = String(formData.get("gameId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { coaches: true, game: { include: { location: true } } },
  });
  if (!team || team.gameId !== gameId) return { error: "Team not found." };
  if (team.coaches.length >= 2) {
    return { error: "That team already has two coaches." };
  }

  const already = await prisma.gameCoach.findUnique({
    where: { gameId_userId: { gameId, userId: user.id } },
  });
  if (already) return { error: "You are already coaching in this game." };

  await prisma.gameCoach.create({
    data: { gameId, teamId, userId: user.id },
  });

  await sendMany([
    {
      to: user.email,
      subject: `You're coaching ${team.name} — ${formatGameDate(team.game.date)}`,
      body: `Hi ${user.name},\n\nYou're signed up to coach ${team.name} on ${formatGameDate(team.game.date)} at ${formatTime(team.game.startTime)}, ${team.game.location.name}.\n\nThanks for stepping up!\n— The Sandlot`,
    },
  ]);

  revalidatePath(`/games/${gameId}`);
}

export async function withdrawAsCoach(gameId: string) {
  const user = await requireUser();
  await prisma.gameCoach.deleteMany({ where: { gameId, userId: user.id } });
  revalidatePath(`/games/${gameId}`);
}

export async function addVolunteer(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const gameId = String(formData.get("gameId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name) return { error: "Volunteer name is required." };
  if (!VOLUNTEER_ROLES.includes(role as (typeof VOLUNTEER_ROLES)[number])) {
    return { error: "Pick a volunteer role." };
  }

  const count = await prisma.gameVolunteer.count({ where: { gameId } });
  if (count >= MAX_VOLUNTEERS_PER_GAME) {
    return { error: "This game already has two volunteers." };
  }

  await prisma.gameVolunteer.create({ data: { gameId, name, role, phone } });
  revalidatePath(`/games/${gameId}`);
}

export async function removeVolunteer(volunteerId: string, gameId: string) {
  await requireUser();
  await prisma.gameVolunteer.delete({ where: { id: volunteerId } });
  revalidatePath(`/games/${gameId}`);
}

export async function renameTeam(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Team name can't be empty." };

  const team = await prisma.team.update({
    where: { id: teamId },
    data: { name },
  });
  revalidatePath(`/games/${team.gameId}`);
}
