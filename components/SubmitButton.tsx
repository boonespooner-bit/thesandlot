"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-lg bg-field px-4 py-2 font-semibold text-chalk hover:bg-field-dark disabled:opacity-50"
      }
    >
      {pending ? "Working…" : children}
    </button>
  );
}
