import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "The Sandlot",
  description:
    "Sign your kids up for sandlot baseball — pick a date, pick a field, play ball.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="bg-field text-chalk shadow-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight">
              <span aria-hidden>⚾</span> The Sandlot
            </Link>
            <nav className="flex items-center gap-4 text-sm font-semibold">
              <Link href="/games" className="hover:underline">
                Games
              </Link>
              {user ? (
                <>
                  <Link href="/kids" className="hover:underline">
                    My Kids
                  </Link>
                  <Link href="/dashboard" className="hover:underline">
                    Dashboard
                  </Link>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="rounded-full bg-field-dark px-3 py-1 hover:bg-night"
                    >
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:underline">
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-dirt px-3 py-1 text-night hover:brightness-110"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-night/50">
          The Sandlot — parents sign &rsquo;em up, kids play ball.
        </footer>
      </body>
    </html>
  );
}
