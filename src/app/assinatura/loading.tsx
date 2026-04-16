import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAssinaturaPage() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <Skeleton className="mx-auto h-7 w-72 rounded-full" />
        <div className="rounded-3xl border bg-background p-6 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
