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
  DEFAULT_RANGE,
  parseRangeKey,
  RANGE_KEYS,
  RANGE_LABELS,
  type RangeKey,
} from "@/lib/range";

export function RangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = parseRangeKey(searchParams.get("range") ?? undefined);
  const [range, setOptimisticRange] = useOptimistic(fromUrl);

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
    <Select value={range} onValueChange={handleChange}>
      <SelectTrigger className="w-[150px]" aria-label="Zeitraum wählen">
        <span>
          <span className="text-muted-foreground">Zeitraum:</span>{" "}
          {RANGE_LABELS[range]}
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
