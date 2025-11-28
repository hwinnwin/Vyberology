import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ReadingSkeleton() {
  return (
    <Card className="border-lf-violet/30 bg-lf-ink/60 p-8 backdrop-blur">
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4 bg-lf-violet/20" />
        <Skeleton className="h-4 w-full bg-lf-violet/20" />
        <Skeleton className="h-4 w-full bg-lf-violet/20" />
        <Skeleton className="h-4 w-5/6 bg-lf-violet/20" />
        <div className="pt-4">
          <Skeleton className="h-4 w-full bg-lf-violet/20" />
          <Skeleton className="h-4 w-full bg-lf-violet/20 mt-2" />
          <Skeleton className="h-4 w-4/5 bg-lf-violet/20 mt-2" />
        </div>
      </div>
    </Card>
  );
}

export function HistoryItemSkeleton() {
  return (
    <Card className="border-lf-violet/30 bg-lf-ink/60 p-4 backdrop-blur">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full bg-lf-violet/20" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 bg-lf-violet/20" />
          <Skeleton className="h-4 w-full bg-lf-violet/20" />
          <Skeleton className="h-4 w-3/4 bg-lf-violet/20" />
        </div>
      </div>
    </Card>
  );
}

export function HistoryListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <HistoryItemSkeleton key={i} />
      ))}
    </div>
  );
}
