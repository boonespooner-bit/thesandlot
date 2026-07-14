"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

export async function addKid(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthYearRaw = String(formData.get("birthYear") ?? "").trim();
  const relation = String(formData.get("relation") ?? "").trim() || null;
  const birthYear = birthYearRaw ? Number(birthYearRaw) : null;

  if (!firstName || !lastName) {
    return { error: "First and last name are required." };
  }
  if (birthYear !== null && (birthYear < 2000 || birthYear > 2030)) {
    return { error: "Birth year looks wrong." };
  }

  await prisma.kid.create({
    data: {
      firstName,
      lastName,
      birthYear,
      parents: { create: { parentId: user.id, relation } },
    },
  });

  revalidatePath("/kids");
  revalidatePath("/dashboard");
}

export async function linkSecondParent(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const kidId = String(formData.get("kidId") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const link = await prisma.parentKid.findUnique({
    where: { parentId_kidId: { parentId: user.id, kidId } },
  });
  if (!link) return { error: "You can only link parents to your own kids." };

  const other = await prisma.user.findUnique({ where: { email } });
  if (!other) return { error: "No account found with that email." };
  if (other.id === user.id) return { error: "That's you already." };

  const existingParents = await prisma.parentKid.count({ where: { kidId } });
  if (existingParents >= 2) return { error: "This kid already has two linked parents." };

  await prisma.parentKid.upsert({
    where: { parentId_kidId: { parentId: other.id, kidId } },
    update: {},
    create: { parentId: other.id, kidId },
  });

  revalidatePath("/kids");
}

export async function removeKid(kidId: string) {
  const user = await requireUser();
  const link = await prisma.parentKid.findUnique({
    where: { parentId_kidId: { parentId: user.id, kidId } },
  });
  if (!link && user.role !== "MANAGER") return;

  await prisma.kid.delete({ where: { id: kidId } });
  revalidatePath("/kids");
  revalidatePath("/dashboard");
}
