import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Skeleton className="mb-6 h-4 w-24" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-1 h-3 w-56" />
      <p className="mt-6 text-xs text-muted-foreground">
        Generiere Digest und Claude-Summaries — kann beim ersten Aufruf einige
        Sekunden dauern.
      </p>
      <div className="mt-8 flex flex-col gap-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-l-2 border-foreground/10 pl-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-6 w-2/3" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-4 h-3 w-1/2" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>
    </main>
  );
}
