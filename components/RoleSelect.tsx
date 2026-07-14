"use client";

import { useTransition } from "react";
import { setUserRole } from "@/app/actions/admin";
import { ROLE_LABELS } from "@/lib/constants";

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={role}
      disabled={disabled || pending}
      onChange={(e) =>
        startTransition(() => setUserRole(userId, e.target.value))
      }
      className={`rounded-lg border px-2 py-1 text-sm font-semibold ${
        role === "ADMIN"
          ? "border-dirt bg-dirt/20"
          : role === "MANAGER"
            ? "border-field/40 bg-green-50"
            : "border-night/20 bg-chalk"
      } disabled:opacity-50`}
    >
      {Object.entries(ROLE_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
