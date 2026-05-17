import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-80" />
      </header>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <div className="flex gap-4 px-4">
              <Skeleton className="size-16 flex-shrink-0 rounded-md sm:size-20" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
