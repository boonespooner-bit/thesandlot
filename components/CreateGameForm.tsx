"use client";

import { useActionState, useState } from "react";
import { createGame, type FormState } from "@/app/actions/games";
import { SubmitButton } from "@/components/SubmitButton";

const inputCls =
  "w-full rounded-lg border border-night/20 bg-chalk px-3 py-2 focus:border-field focus:outline-none";

export function CreateGameForm({
  locations,
}: {
  locations: { id: string; name: string; address: string | null }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(
    createGame,
    undefined
  );
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "new");

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Date</label>
          <input name="date" type="date" required className={inputCls} />
          <p className="mt-1 text-xs text-night/60">One game per date.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Start time</label>
          <input name="startTime" type="time" required className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Location</label>
        <select
          name="locationId"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className={inputCls}
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
              {l.address ? ` — ${l.address}` : ""}
            </option>
          ))}
          <option value="new">+ Add a new field…</option>
        </select>
      </div>
      {locationId === "new" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="newLocationName"
            placeholder="Field name (e.g. Vincent's Lot)"
            className={inputCls}
          />
          <input
            name="newLocationAddress"
            placeholder="Address (optional)"
            className={inputCls}
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-semibold">Notes (optional)</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Bring water. Beast lives over the left-field fence."
          className={inputCls}
        />
      </div>
      <SubmitButton>Schedule game</SubmitButton>
    </form>
  );
}
