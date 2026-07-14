import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AddKidForm, LinkParentForm } from "@/components/KidForms";
import { removeKid } from "@/app/actions/kids";
import { kidName } from "@/lib/format";

export default async function KidsPage() {
  const user = await requireUser();

  const links = await prisma.parentKid.findMany({
    where: { parentId: user.id },
    include: {
      kid: {
        include: {
          parents: { include: { parent: true } },
          signups: {
            where: { game: { date: { gte: new Date(new Date().toDateString()) } } },
          },
        },
      },
    },
    orderBy: { kid: { firstName: "asc" } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">My kids</h1>
        <p className="mt-1 text-night/70">
          Kids are the players — add them once and they stay on the sandlot
          roster. You can link one other parent to each kid so either of you
          can sign them up.
        </p>
      </div>

      <section className="rounded-2xl bg-chalk p-6 shadow">
        <h2 className="mb-3 text-xl font-black">Add a kid</h2>
        <AddKidForm />
      </section>

      <section className="space-y-4">
        {links.length === 0 ? (
          <p className="rounded-2xl bg-chalk p-6 text-night/70 shadow">
            No kids on your roster yet.
          </p>
        ) : (
          links.map((l) => (
            <div key={l.kidId} className="rounded-2xl bg-chalk p-6 shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">
                    {kidName(l.kid)}
                    {l.kid.birthYear && (
                      <span className="ml-2 text-sm font-normal text-night/60">
                        b. {l.kid.birthYear}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-night/70">
                    Parents:{" "}
                    {l.kid.parents
                      .map(
                        (p) =>
                          `${p.parent.name}${p.relation ? ` (${p.relation})` : ""}`
                      )
                      .join(", ")}
                  </p>
                  <p className="text-sm text-night/70">
                    Upcoming games signed up: {l.kid.signups.length}
                  </p>
                </div>
                <form action={removeKid.bind(null, l.kidId)}>
                  <button
                    type="submit"
                    className="text-sm font-semibold text-red-600 underline"
                  >
                    Remove
                  </button>
                </form>
              </div>
              {l.kid.parents.length < 2 && <LinkParentForm kidId={l.kidId} />}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
