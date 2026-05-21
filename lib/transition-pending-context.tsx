"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Shared "any client transition pending" state. Lets the LensSelector show
 * a Sonnet-is-working banner not just for its own `Anwenden`-click, but
 * also when Range/Sort/Topic changes trigger a fresh lens scoring on the
 * server. Each selector reports its `isPending` to the provider via the
 * `useReportTransitionPending` hook.
 */
const TransitionPendingContext = createContext<{
  pendingCount: number;
  inc: () => void;
  dec: () => void;
}>({
  pendingCount: 0,
  inc: () => {},
  dec: () => {},
});

export function TransitionPendingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [pendingCount, setPendingCount] = useState(0);
  const inc = useCallback(() => setPendingCount((c) => c + 1), []);
  const dec = useCallback(() => setPendingCount((c) => c - 1), []);
  return (
    <TransitionPendingContext.Provider value={{ pendingCount, inc, dec }}>
      {children}
    </TransitionPendingContext.Provider>
  );
}

/** Returns true while any subscribed transition (Range/Sort/Topic/Lens) is in flight. */
export function useAnyTransitionPending(): boolean {
  return useContext(TransitionPendingContext).pendingCount > 0;
}

/**
 * Each selector with its own `useTransition` calls this hook with its
 * `isPending` flag. The hook bumps a shared counter for the duration of
 * the pending state.
 */
export function useReportTransitionPending(isPending: boolean): void {
  const { inc, dec } = useContext(TransitionPendingContext);
  useEffect(() => {
    if (!isPending) return;
    inc();
    return () => dec();
  }, [isPending, inc, dec]);
}
