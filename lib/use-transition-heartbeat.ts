"use client";

import { useEffect, useState } from "react";

/**
 * Ticks once per second while `isPending` is true. Returns the elapsed
 * seconds since the transition started.
 *
 * The setInterval doubles as a heartbeat for React's concurrent
 * scheduler: a server-component transition commit otherwise sits at low
 * priority until the next user interaction, which felt like the UI was
 * frozen ("page only updates when I click somewhere"). The 1 s tick
 * wakes the scheduler and gets pending commits applied as soon as the
 * server response arrives.
 *
 * Use in any client component that wraps `router.push` in
 * `startTransition` and waits on a long server render.
 */
export function useTransitionHeartbeat(isPending: boolean): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!isPending) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    setElapsedSeconds(0);
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isPending]);
  return elapsedSeconds;
}
