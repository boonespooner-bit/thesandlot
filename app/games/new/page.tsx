import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { CreateGameForm } from "@/components/CreateGameForm";

export default async function NewGamePage() {
  await requireManager();
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-3xl font-black">Schedule a game</h1>
      <p className="mb-6 text-night/70">
        One game per date. Home and Away teams are created automatically and
        rebuilt fresh for every game.
      </p>
      <div className="rounded-2xl bg-chalk p-6 shadow">
        <CreateGameForm locations={locations} />
      </div>
    </div>
  );
}
