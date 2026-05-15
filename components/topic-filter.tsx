"use client";

import { ListFilter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseTopicSlugs } from "@/lib/scoring";
import type { PHTopic } from "@/lib/ph/types";

export function TopicFilter({ topics }: { topics: PHTopic[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = new Set(
    parseTopicSlugs(searchParams.get("topics") ?? undefined),
  );

  function applyTopics(next: Set<string>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.size === 0) {
      params.delete("topics");
    } else {
      params.set("topics", Array.from(next).join(","));
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  }

  function toggle(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    applyTopics(next);
  }

  function clear() {
    applyTopics(new Set());
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className="gap-1.5" />}>
        <ListFilter className="size-4" aria-hidden />
        Topics
        {selected.size > 0 && (
          <span className="ml-1 rounded-full bg-foreground px-1.5 text-xs font-medium text-background">
            {selected.size}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="flex max-h-80 flex-col overflow-y-auto py-1">
          {topics.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No topics available.
            </p>
          ) : (
            topics.map((t) => (
              <label
                key={t.slug}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={selected.has(t.slug)}
                  onCheckedChange={() => toggle(t.slug)}
                />
                <span className="flex-1">{t.name}</span>
              </label>
            ))
          )}
        </div>
        {selected.size > 0 && (
          <div className="border-t p-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="w-full"
            >
              Clear filters
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
