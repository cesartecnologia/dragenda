import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingMedicosPage() {
  return (
    <PageContainer>
      <div className="space-y-6 px-4 py-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 xl:flex-row">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <CardHeader><Skeleton className="h-28 w-full rounded-xl" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
