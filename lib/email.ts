import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

// Emails go out through SMTP when SMTP_HOST is configured; otherwise they
// are logged to the console. Either way every email is recorded in EmailLog
// so managers can audit what was sent (and dev works with no mail server).

function transporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendEmail(to: string, subject: string, body: string) {
  let delivered = false;
  const t = transporter();
  if (t) {
    try {
      await t.sendMail({
        from: process.env.SMTP_FROM ?? "The Sandlot <noreply@thesandlot.local>",
        to,
        subject,
        text: body,
      });
      delivered = true;
    } catch (err) {
      console.error(`[email] failed to send to ${to}:`, err);
    }
  } else {
    console.log(`[email:dev] To: ${to}\nSubject: ${subject}\n${body}\n`);
  }

  await prisma.emailLog.create({ data: { to, subject, body, delivered } });
}

export async function sendMany(
  messages: { to: string; subject: string; body: string }[]
) {
  await Promise.all(messages.map((m) => sendEmail(m.to, m.subject, m.body)));
}
