import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex gap-4 sm:gap-6">
        <Skeleton className="size-20 flex-shrink-0 rounded-lg sm:size-24" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-2/3 sm:h-9" />
          <Skeleton className="h-5 w-full" />
          <div className="mt-1 flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="mt-8 border-t pt-8">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
      </div>

      <div className="mt-8 border-t pt-8">
        <Skeleton className="h-6 w-40" />
        <div className="mt-4 flex flex-col gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
