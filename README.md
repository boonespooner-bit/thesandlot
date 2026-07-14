# ⚾ The Sandlot

A website for organizing pickup ("sandlot") baseball games for kids. Parents
make accounts, add their kids to the roster, and sign them up to play on a
specific date at a specific field. When enough players are in, the game is on.

The game setup — two teams, a diamond view, and position assignments for every
inning — follows the model of
[EasyGameManager](https://github.com/boonespooner-bit/EasyGameManager).

## How it works

- **Kids are the players.** Parents don't play — they create an account, add
  their kids once (each kid can be linked to up to two parent accounts), and
  sign them up game by game. The kid roster persists across games.
- **One game per date**, at a specific field and start time. Managers schedule
  games and can add new field locations on the fly.
- **A game confirms itself at 14 players** (7 per team minimum). Everyone who
  signed up gets a "Game on!" email. If withdrawals drop it below 14, the game
  reopens.
- **Teams exist only for one game.** Home and Away teams are created fresh with
  every game. Coaches or managers split the signed-up kids onto the two sides
  (an auto-balance button deals them out alternately).
- **Two parent coaches per team.** Any parent can volunteer to coach a side —
  each team holds a maximum of two coaches, and volunteering sends a
  confirmation email.
- **Two extra volunteers per game** — typically high-school players — can be
  added as the umpire and pitcher.
- **Six innings, every position assigned.** Coaches get an EasyGameManager-style
  game plan: a diamond visualization per inning plus a full 6-inning grid.
  An auto-generate button builds a fair lineup (positions rotate every inning,
  bench time is spread evenly and non-consecutive), and every cell can be
  overridden by hand. Short sandlot rosters fill the most important positions
  first (7 players a side fields P, C, 1B, 2B, 3B, SS, CF).
- **Confirmation emails** are sent for account creation, kid signups, coach
  volunteering, game confirmation, and cancellations. With no SMTP server
  configured they are logged to the console instead — and every email is
  recorded in the `EmailLog` table either way.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router, server actions) + React 19
- [Tailwind CSS 4](https://tailwindcss.com)
- [Prisma 6](https://prisma.io) with SQLite (swap `datasource` provider +
  `DATABASE_URL` for PostgreSQL in production)
- Auth: bcrypt password hashing + JWT session cookie (`jose`)
- Email: `nodemailer` (SMTP optional)

## Getting started

```bash
npm install
npm run db:push     # create the SQLite database
npm run db:seed     # optional: demo data
npm run dev         # http://localhost:3000
```

### Seeded logins (password: `sandlot123`)

| Account | Role |
| --- | --- |
| `manager@thesandlot.local` | Manager — schedules games |
| `melissa@example.com`, `ray@example.com`, … | Parents with kids |

**The first account registered in an empty database automatically becomes the
manager.** Everyone who registers after that is a parent.

## Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma connection string (default `file:./dev.db`) |
| `SESSION_SECRET` | Secret for signing session JWTs — change in production |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Optional — real email delivery. Without `SMTP_HOST`, emails are logged to the console. |

## Roles & permissions

| Ability | Parent | Coach (per game) | Manager |
| --- | --- | --- | --- |
| Add/manage own kids | ✅ | ✅ | ✅ |
| Sign up own kids for a game | ✅ | ✅ | ✅ |
| Volunteer to coach a team | ✅ | — | ✅ |
| Add ump/pitcher volunteers | ✅ | ✅ | ✅ |
| Build teams / set lineups | — | ✅ (their game) | ✅ |
| Schedule / cancel games | — | — | ✅ |
