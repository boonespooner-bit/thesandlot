"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

// Owner-only controls: user roles and hard game deletion.

export async function setUserRole(userId: string, role: string) {
  const admin = await requireAdmin();

  if (!["PARENT", "MANAGER", "ADMIN"].includes(role)) return;
  // The owner can't demote themselves — prevents locking everyone out.
  if (userId === admin.id) return;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  if (role === "MANAGER" || role === "ADMIN") {
    await sendEmail(
      user.email,
      role === "ADMIN"
        ? "You're now an owner of The Sandlot"
        : "You're now a manager at The Sandlot",
      `Hi ${user.name},\n\n${admin.name} made you a ${role === "ADMIN" ? "co-owner" : "manager"} of The Sandlot. You can now schedule games, build teams and set lineups.\n\n— The Sandlot`
    );
  }

  revalidatePath("/admin");
}

/** Permanently delete a game and everything hanging off it. */
export async function deleteGame(gameId: string) {
  await requireAdmin();
  await prisma.game.delete({ where: { id: gameId } });
  revalidatePath("/admin");
  revalidatePath("/games");
  revalidatePath("/");
}
