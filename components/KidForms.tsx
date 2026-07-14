"use client";

import { useActionState } from "react";
import {
  addKid,
  linkSecondParent,
  type FormState,
} from "@/app/actions/kids";
import { SubmitButton } from "@/components/SubmitButton";

const inputCls =
  "w-full rounded-lg border border-night/20 bg-chalk px-3 py-2 focus:border-field focus:outline-none";

function ErrorNote({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
      {state.error}
    </p>
  );
}

export function AddKidForm() {
  const [state, action] = useActionState(addKid, undefined);
  return (
    <form action={action} className="space-y-3">
      <ErrorNote state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="firstName" required placeholder="First name" className={inputCls} />
        <input name="lastName" required placeholder="Last name" className={inputCls} />
        <input
          name="birthYear"
          type="number"
          min={2000}
          max={2030}
          placeholder="Birth year (optional)"
          className={inputCls}
        />
        <input
          name="relation"
          placeholder="You are their… (mom, dad, …)"
          className={inputCls}
        />
      </div>
      <SubmitButton>Add kid</SubmitButton>
    </form>
  );
}

export function LinkParentForm({ kidId }: { kidId: string }) {
  const [state, action] = useActionState(linkSecondParent, undefined);
  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="kidId" value={kidId} />
      <input
        name="email"
        type="email"
        required
        placeholder="Other parent's account email"
        className="rounded-lg border border-night/20 bg-chalk px-3 py-1.5 text-sm focus:border-field focus:outline-none"
      />
      <SubmitButton className="rounded-lg bg-night/80 px-3 py-1.5 text-sm font-semibold text-chalk hover:bg-night disabled:opacity-50">
        Link parent
      </SubmitButton>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
