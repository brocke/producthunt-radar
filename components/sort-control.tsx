"use client";

import { startTransition, useOptimistic } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  parseSortKey,
  SORT_KEYS,
  SORT_LABELS,
  type SortKey,
} from "@/lib/scoring";

export function SortControl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = parseSortKey(searchParams.get("sort") ?? undefined);
  // When a lens is active, it overrides the sort order entirely (see
  // app/page.tsx). Disabling the dropdown makes that visible.
  const lensActive = !!searchParams.get("lens");
  // Without an optimistic value, Base UI's Select briefly shows the check
  // mark on both old and new item during the router.push roundtrip —
  // KOE-351. Reflecting the click locally keeps the controlled value in
  // sync with the user's intent before the URL updates.
  const [sort, setOptimisticSort] = useOptimistic(fromUrl);

  function handleChange(value: string | null) {
    if (!value) return;
    const next = parseSortKey(value);
    startTransition(() => {
      setOptimisticSort(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "votes") {
        params.delete("sort");
      } else {
        params.set("sort", next);
      }
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  }

  return (
    <Select value={sort} onValueChange={handleChange} disabled={lensActive}>
      <SelectTrigger
        className="w-[170px]"
        aria-label="Sort posts"
        title={lensActive ? "Sortierung wird durch aktive Lens überschrieben" : undefined}
      >
        <span>
          <span className="text-muted-foreground">Sort:</span>{" "}
          {SORT_LABELS[sort]}
        </span>
      </SelectTrigger>
      <SelectContent>
        {SORT_KEYS.map((key: SortKey) => (
          <SelectItem key={key} value={key}>
            {SORT_LABELS[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
