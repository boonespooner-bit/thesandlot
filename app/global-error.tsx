"use client";

// Last-resort boundary: catches errors thrown by the root layout itself.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
          ⚾ The Sandlot hit an error
        </h1>
        <p style={{ marginTop: "1rem", color: "#555" }}>
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#888" }}>
            Error digest: <code>{error.digest}</code> — check the server logs
            (and <code>/api/health</code>) for details.
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "9999px",
            background: "#2f7d3b",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
