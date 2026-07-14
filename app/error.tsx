"use client";

// Catches errors below the root layout and shows something useful
// instead of Next's generic "Application error" screen.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-chalk p-8 text-center shadow">
      <h1 className="text-2xl font-black">Foul ball — something broke</h1>
      <p className="mt-3 text-night/70">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-night/50">
          Error digest: <code>{error.digest}</code> — search for this in the
          server logs to find the full stack trace.
        </p>
      )}
      <div className="mt-5 flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-field px-4 py-2 font-bold text-chalk hover:bg-field-dark"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-night/20 px-4 py-2 font-bold hover:bg-sand"
        >
          Back home
        </a>
      </div>
    </div>
  );
}
