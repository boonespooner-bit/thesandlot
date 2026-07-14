"use client";

import { useActionState } from "react";
import { signUpKids, type FormState as SignupState } from "@/app/actions/signups";
import {
  addVolunteer,
  volunteerAsCoach,
  type FormState as GameState,
} from "@/app/actions/games";
import { SubmitButton } from "@/components/SubmitButton";

const inputCls =
  "rounded-lg border border-night/20 bg-chalk px-3 py-2 focus:border-field focus:outline-none";

export function SignupKidsForm({
  gameId,
  kids,
}: {
  gameId: string;
  kids: { id: string; name: string; signedUp: boolean }[];
}) {
  const [state, action] = useActionState<SignupState, FormData>(
    signUpKids,
    undefined
  );
  const available = kids.filter((k) => !k.signedUp);

  if (kids.length === 0) {
    return (
      <p className="text-sm text-night/70">
        Add your kids on the <a href="/kids" className="font-semibold text-field underline">My Kids</a> page
        first, then come back to sign them up.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {state?.error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.ok}
        </p>
      )}
      <input type="hidden" name="gameId" value={gameId} />
      <div className="flex flex-wrap gap-3">
        {kids.map((k) => (
          <label
            key={k.id}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
              k.signedUp
                ? "border-green-300 bg-green-50 text-green-700"
                : "cursor-pointer border-night/20 bg-chalk hover:border-field"
            }`}
          >
            {k.signedUp ? (
              <>✓ {k.name}</>
            ) : (
              <>
                <input type="checkbox" name="kidIds" value={k.id} className="accent-field" />
                {k.name}
              </>
            )}
          </label>
        ))}
      </div>
      {available.length > 0 && <SubmitButton>Sign up selected kids</SubmitButton>}
    </form>
  );
}

export function VolunteerCoachForm({
  gameId,
  teams,
}: {
  gameId: string;
  teams: { id: string; name: string; openSpots: number }[];
}) {
  const [state, action] = useActionState<GameState, FormData>(
    volunteerAsCoach,
    undefined
  );
  const openTeams = teams.filter((t) => t.openSpots > 0);
  if (openTeams.length === 0) return null;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      {state?.error && (
        <p className="w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <input type="hidden" name="gameId" value={gameId} />
      <select name="teamId" className={inputCls + " text-sm"}>
        {openTeams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.openSpots} coach spot{t.openSpots > 1 ? "s" : ""} open)
          </option>
        ))}
      </select>
      <SubmitButton className="rounded-lg bg-dirt px-3 py-2 text-sm font-bold text-night hover:brightness-110 disabled:opacity-50">
        Volunteer to coach
      </SubmitButton>
    </form>
  );
}

export function AddVolunteerForm({ gameId }: { gameId: string }) {
  const [state, action] = useActionState<GameState, FormData>(
    addVolunteer,
    undefined
  );
  return (
    <form action={action} className="space-y-2">
      {state?.error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <input type="hidden" name="gameId" value={gameId} />
      <div className="flex flex-wrap gap-2">
        <input
          name="name"
          required
          placeholder="Name (high schooler)"
          className={inputCls + " text-sm"}
        />
        <select name="role" className={inputCls + " text-sm"}>
          <option value="UMPIRE">Umpire</option>
          <option value="PITCHER">Pitcher</option>
        </select>
        <input name="phone" placeholder="Phone (optional)" className={inputCls + " text-sm"} />
        <SubmitButton className="rounded-lg bg-night/80 px-3 py-2 text-sm font-semibold text-chalk hover:bg-night disabled:opacity-50">
          Add volunteer
        </SubmitButton>
      </div>
    </form>
  );
}
