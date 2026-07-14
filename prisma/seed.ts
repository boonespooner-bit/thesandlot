// Demo data: a manager, a squad of parents and kids, and two games —
// one confirmed (14 players, teams, coaches, volunteers) and one still open.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "sandlot123";

const FAMILIES: { parent: string; email: string; kids: [string, string][] }[] = [
  { parent: "Melissa Smalls", email: "melissa@example.com", kids: [["Scotty", "Smalls"]] },
  { parent: "Ray Rodriguez", email: "ray@example.com", kids: [["Benny", "Rodriguez"]] },
  { parent: "Helen Porter", email: "helen@example.com", kids: [["Hamilton", "Porter"], ["Penny", "Porter"]] },
  { parent: "Frank LaRussa", email: "frank@example.com", kids: [["Michael", "LaRussa"], ["Tony", "LaRussa"]] },
  { parent: "Grace Timmons", email: "grace@example.com", kids: [["Timmy", "Timmons"], ["Tommy", "Timmons"]] },
  { parent: "Dana DeNunez", email: "dana@example.com", kids: [["Kenny", "DeNunez"], ["Rosa", "DeNunez"]] },
  { parent: "Paul Mitchell", email: "paul@example.com", kids: [["Alan", "Mitchell"], ["Maya", "Mitchell"]] },
  { parent: "Rita Weems", email: "rita@example.com", kids: [["Bertram", "Weems"], ["Lucy", "Weems"]] },
];

function utcDateDaysFromNow(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@thesandlot.local" },
    update: {},
    create: {
      email: "owner@thesandlot.local",
      name: "The Commissioner",
      passwordHash,
      role: "ADMIN",
    },
  });
  void owner;

  const manager = await prisma.user.upsert({
    where: { email: "manager@thesandlot.local" },
    update: {},
    create: {
      email: "manager@thesandlot.local",
      name: "Coach Boone",
      passwordHash,
      role: "MANAGER",
    },
  });

  const parents: { id: string; email: string; name: string }[] = [];
  const kidsByParent = new Map<string, string[]>();

  for (const fam of FAMILIES) {
    const parent = await prisma.user.upsert({
      where: { email: fam.email },
      update: {},
      create: { email: fam.email, name: fam.parent, passwordHash, role: "PARENT" },
    });
    parents.push(parent);
    const kidIds: string[] = [];
    for (const [firstName, lastName] of fam.kids) {
      const existing = await prisma.kid.findFirst({
        where: { firstName, lastName },
      });
      const kid =
        existing ??
        (await prisma.kid.create({
          data: {
            firstName,
            lastName,
            birthYear: 2014 + Math.floor(Math.random() * 4),
            parents: { create: { parentId: parent.id } },
          },
        }));
      kidIds.push(kid.id);
    }
    kidsByParent.set(parent.id, kidIds);
  }

  const lot = await prisma.location.upsert({
    where: { id: "seed-vincents-lot" },
    update: {},
    create: {
      id: "seed-vincents-lot",
      name: "Vincent's Sandlot",
      address: "Behind Vincent's Drugstore, San Fernando Valley",
    },
  });
  const park = await prisma.location.upsert({
    where: { id: "seed-city-park" },
    update: {},
    create: {
      id: "seed-city-park",
      name: "City Park Field 3",
      address: "410 Elm St",
    },
  });

  // --- Game 1: Saturday-ish, fully signed up and confirmed ---
  const date1 = utcDateDaysFromNow(3);
  let game1 = await prisma.game.findUnique({ where: { date: date1 } });
  if (!game1) {
    game1 = await prisma.game.create({
      data: {
        date: date1,
        startTime: "10:00",
        locationId: lot.id,
        createdById: manager.id,
        notes: "Bring water and gloves. Legends never die.",
        teams: {
          create: [
            { side: "HOME", name: "Sandlot Sluggers" },
            { side: "AWAY", name: "Backyard Bombers" },
          ],
        },
      },
    });

    // Sign up 14 kids.
    const allKidEntries: { kidId: string; parentId: string }[] = [];
    for (const p of parents) {
      for (const kidId of kidsByParent.get(p.id) ?? []) {
        allKidEntries.push({ kidId, parentId: p.id });
      }
    }
    const fourteen = allKidEntries.slice(0, 14);
    for (const e of fourteen) {
      await prisma.signup.create({
        data: { gameId: game1.id, kidId: e.kidId, parentId: e.parentId },
      });
    }
    await prisma.game.update({
      where: { id: game1.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    // Teams: deal alternately, 7 a side.
    const teams = await prisma.team.findMany({
      where: { gameId: game1.id },
      orderBy: { side: "desc" },
    });
    await prisma.teamPlayer.createMany({
      data: fourteen.map((e, i) => ({
        teamId: teams[i % 2].id,
        kidId: e.kidId,
      })),
    });

    // Coaches: two per team.
    await prisma.gameCoach.createMany({
      data: [
        { gameId: game1.id, teamId: teams[0].id, userId: parents[0].id },
        { gameId: game1.id, teamId: teams[0].id, userId: parents[1].id },
        { gameId: game1.id, teamId: teams[1].id, userId: parents[2].id },
        { gameId: game1.id, teamId: teams[1].id, userId: parents[3].id },
      ],
    });

    // Volunteers: a high-school ump and pitcher.
    await prisma.gameVolunteer.createMany({
      data: [
        { gameId: game1.id, name: "Jake Turner (HS)", role: "UMPIRE" },
        { gameId: game1.id, name: "Sam Ortiz (HS)", role: "PITCHER" },
      ],
    });
  }

  // --- Game 2: next week, still open ---
  const date2 = utcDateDaysFromNow(10);
  let game2 = await prisma.game.findUnique({ where: { date: date2 } });
  if (!game2) {
    game2 = await prisma.game.create({
      data: {
        date: date2,
        startTime: "17:30",
        locationId: park.id,
        createdById: manager.id,
        teams: {
          create: [
            { side: "HOME", name: "Dirt Dogs" },
            { side: "AWAY", name: "The Heaters" },
          ],
        },
      },
    });
    // A handful of early signups.
    let count = 0;
    outer: for (const p of parents) {
      for (const kidId of kidsByParent.get(p.id) ?? []) {
        await prisma.signup.create({
          data: { gameId: game2.id, kidId, parentId: p.id },
        });
        if (++count >= 5) break outer;
      }
    }
  }

  console.log("Seeded.");
  console.log(`Owner login:    owner@thesandlot.local / ${PASSWORD}`);
  console.log(`Manager login:  manager@thesandlot.local / ${PASSWORD}`);
  console.log(`Parent logins:  melissa@example.com (etc.) / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
