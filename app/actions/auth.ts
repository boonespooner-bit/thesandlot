"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export type FormState = { error?: string } | undefined;

// Signing in is the first code path that needs SESSION_SECRET, so a missing
// env var would otherwise surface as an opaque crash exactly at login.
function configError(): FormState {
  if (!process.env.SESSION_SECRET) {
    return {
      error:
        "Server is misconfigured: SESSION_SECRET is not set. Add it in your hosting dashboard's Environment settings (see /api/health for a full config check).",
    };
  }
  return undefined;
}

export async function register(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const misconfigured = configError();
  if (misconfigured) return misconfigured;

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

  // The first account in the system becomes the owner (super admin).
  // ADMIN_EMAIL (env) also always gets the owner role — a recovery hatch
  // if the owner account is lost or the first registration went to the
  // wrong person.
  const userCount = await prisma.user.count();
  const isOwner =
    userCount === 0 ||
    (!!process.env.ADMIN_EMAIL &&
      email === process.env.ADMIN_EMAIL.trim().toLowerCase());
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      role: isOwner ? "ADMIN" : "PARENT",
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
  const misconfigured = configError();
  if (misconfigured) return misconfigured;

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  // ADMIN_EMAIL recovery hatch: promote on login for existing accounts too.
  if (
    process.env.ADMIN_EMAIL &&
    email === process.env.ADMIN_EMAIL.trim().toLowerCase() &&
    user.role !== "ADMIN"
  ) {
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
