"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { sendEmail, sendMany } from "@/lib/email";
import { isStaff, MIN_PLAYERS_TOTAL } from "@/lib/constants";
import { formatGameDate, formatTime, kidName } from "@/lib/format";

export type FormState = { error?: string; ok?: string } | undefined;

async function gameWithDetails(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      location: true,
      signups: { include: { parent: true, kid: true } },
    },
  });
}

/** Confirm the game once enough players are in; reopen if it drops below. */
async function syncGameStatus(gameId: string) {
  const game = await gameWithDetails(gameId);
  if (!game || game.status === "CANCELLED" || game.status === "COMPLETED") return;

  const count = game.signups.length;

  if (game.status === "OPEN" && count >= MIN_PLAYERS_TOTAL) {
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    const seen = new Set<string>();
    const messages = game.signups
      .filter((s) =>
        seen.has(s.parent.email) ? false : seen.add(s.parent.email)
      )
      .map((s) => ({
        to: s.parent.email,
        subject: `Game on! ${formatGameDate(game.date)} is confirmed`,
        body:
          `Great news — we have ${count} players, so the sandlot game is officially ON.\n\n` +
          `When: ${formatGameDate(game.date)} at ${formatTime(game.startTime)}\n` +
          `Where: ${game.location.name}${game.location.address ? ` (${game.location.address})` : ""}\n\n` +
          `See you at the field!\n— The Sandlot`,
      }));
    await sendMany(messages);
  } else if (game.status === "CONFIRMED" && count < MIN_PLAYERS_TOTAL) {
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "OPEN", confirmedAt: null },
    });
  }
}

export async function signUpKids(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const gameId = String(formData.get("gameId") ?? "");
  const kidIds = formData.getAll("kidIds").map(String).filter(Boolean);

  if (kidIds.length === 0) return { error: "Pick at least one kid to sign up." };

  const game = await gameWithDetails(gameId);
  if (!game) return { error: "Game not found." };
  if (game.status === "CANCELLED" || game.status === "COMPLETED") {
    return { error: "Signups are closed for this game." };
  }

  // Only a linked parent can sign a kid up.
  const links = await prisma.parentKid.findMany({
    where: { parentId: user.id, kidId: { in: kidIds } },
    include: { kid: true },
  });
  if (links.length !== kidIds.length) {
    return { error: "You can only sign up your own kids." };
  }

  const created: string[] = [];
  for (const link of links) {
    const existing = await prisma.signup.findUnique({
      where: { gameId_kidId: { gameId, kidId: link.kidId } },
    });
    if (existing) continue;
    await prisma.signup.create({
      data: { gameId, kidId: link.kidId, parentId: user.id },
    });
    created.push(kidName(link.kid));
  }

  if (created.length === 0) {
    return { error: "Those kids are already signed up for this game." };
  }

  await sendEmail(
    user.email,
    `Signed up: ${created.join(", ")} — ${formatGameDate(game.date)}`,
    `Hi ${user.name},\n\n${created.join(" and ")} ${created.length > 1 ? "are" : "is"} signed up to play on ${formatGameDate(game.date)} at ${formatTime(game.startTime)}, ${game.location.name}.\n\nWe'll email you again once enough players have joined to confirm the game (${MIN_PLAYERS_TOTAL} needed).\n\n— The Sandlot`
  );

  await syncGameStatus(gameId);

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/dashboard");
  return { ok: `${created.join(" and ")} signed up. Confirmation email sent.` };
}

export async function withdrawSignup(signupId: string) {
  const user = await requireUser();
  const signup = await prisma.signup.findUnique({
    where: { id: signupId },
    include: { kid: { include: { parents: true } } },
  });
  if (!signup) return;

  const isParent = signup.kid.parents.some((p) => p.parentId === user.id);
  if (!isParent && !isStaff(user.role)) return;

  // Also pull the kid off any team roster / lineup for this game.
  const teams = await prisma.team.findMany({ where: { gameId: signup.gameId } });
  const teamIds = teams.map((t) => t.id);
  await prisma.$transaction([
    prisma.teamPlayer.deleteMany({
      where: { kidId: signup.kidId, teamId: { in: teamIds } },
    }),
    prisma.inningAssignment.deleteMany({
      where: { kidId: signup.kidId, teamId: { in: teamIds } },
    }),
    prisma.signup.delete({ where: { id: signupId } }),
  ]);

  await syncGameStatus(signup.gameId);
  revalidatePath(`/games/${signup.gameId}`);
  revalidatePath("/dashboard");
}
