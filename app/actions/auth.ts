"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export type FormState = { error?: string } | undefined;

export async function register(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  // The first account in the system becomes the league manager.
  const userCount = await prisma.user.count();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      role: userCount === 0 ? "MANAGER" : "PARENT",
    },
  });

  await sendEmail(
    email,
    "Welcome to The Sandlot!",
    `Hi ${name},\n\nYour Sandlot account is ready. Add your kids, then sign them up for the next game.\n\nSee you at the field!\n— The Sandlot`
  );

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
