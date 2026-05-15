// Next.js instrumentation hook — runs once per server process start.
// We use it to register the snapshot cron job. See plan.md §5 (Phase 6).

declare global {
  // eslint-disable-next-line no-var
  var __cronStarted: boolean | undefined;
}

export async function register() {
  // Skip on the Edge runtime — node-cron + better-sqlite3 are Node-only.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Next.js dev-mode HMR can re-run this. Guard against multiple cron registrations.
  if (globalThis.__cronStarted) return;
  globalThis.__cronStarted = true;

  const cron = await import("node-cron");
  const { takeSnapshot } = await import("@/lib/snapshots/take");

  // Every 6 hours, on the hour.
  cron.schedule("0 */6 * * *", () => {
    takeSnapshot().catch((error) => {
      console.error("[snapshot] cron run failed:", error);
    });
  });

  // Kick off one snapshot ~10s after start so dev/local users see data
  // without waiting for the next 6h tick.
  setTimeout(() => {
    takeSnapshot().catch((error) => {
      console.error("[snapshot] initial run failed:", error);
    });
  }, 10_000);

  console.log("[snapshot] cron registered: every 6 hours");
}
