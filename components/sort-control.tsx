"use client";

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
  const current = parseSortKey(searchParams.get("sort") ?? undefined);

  function handleChange(value: string | null) {
    if (!value) return;
    const next = parseSortKey(value);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "votes") {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-[170px]" aria-label="Sort posts">
        <span>
          <span className="text-muted-foreground">Sort:</span>{" "}
          {SORT_LABELS[current]}
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
