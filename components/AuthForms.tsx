"use client";

import { useActionState } from "react";
import { login, register, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

const inputCls =
  "w-full rounded-lg border border-night/20 bg-chalk px-3 py-2 focus:border-field focus:outline-none";

export function ErrorNote({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
      {state.error}
    </p>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(register, undefined);
  return (
    <form action={action} className="space-y-4">
      <ErrorNote state={state} />
      <div>
        <label className="mb-1 block text-sm font-semibold">Your name</label>
        <input name="name" required className={inputCls} placeholder="Scotty Smalls" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Email</label>
        <input name="email" type="email" required className={inputCls} placeholder="you@example.com" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Phone (optional)</label>
        <input name="phone" type="tel" className={inputCls} placeholder="555-867-5309" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Password</label>
        <input name="password" type="password" required minLength={8} className={inputCls} />
      </div>
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <ErrorNote state={state} />
      <div>
        <label className="mb-1 block text-sm font-semibold">Email</label>
        <input name="email" type="email" required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Password</label>
        <input name="password" type="password" required className={inputCls} />
      </div>
      <SubmitButton>Log in</SubmitButton>
    </form>
  );
}
