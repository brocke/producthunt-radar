"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DEFAULT_RANGE,
  parseRangeKey,
  RANGE_KEYS,
  RANGE_LABELS,
  type RangeKey,
} from "@/lib/range";
import { useTransitionHeartbeat } from "@/lib/use-transition-heartbeat";

export function RangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = parseRangeKey(searchParams.get("range") ?? undefined);
  const [isPending, startTransition] = useTransition();
  const [range, setOptimisticRange] = useOptimistic(fromUrl);
  const elapsedSeconds = useTransitionHeartbeat(isPending);

  function handleChange(value: string | null) {
    if (!value) return;
    const next = parseRangeKey(value);
    startTransition(() => {
      setOptimisticRange(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_RANGE) {
        params.delete("range");
      } else {
        params.set("range", next);
      }
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  }

  return (
    <Select value={range} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-[170px]" aria-label="Zeitraum wählen">
        <span>
          <span className="text-muted-foreground">Zeitraum:</span>{" "}
          {RANGE_LABELS[range]}
          {isPending && (
            <span className="text-muted-foreground tabular-nums">
              {" · "}
              {elapsedSeconds}s
            </span>
          )}
        </span>
      </SelectTrigger>
      <SelectContent>
        {RANGE_KEYS.map((key: RangeKey) => (
          <SelectItem key={key} value={key}>
            {RANGE_LABELS[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
