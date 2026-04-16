import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageContainer, PageContent, PageHeader, PageHeaderContent } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAgendamentosPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <Skeleton className="h-8 w-44" />
        </PageHeaderContent>
      </PageHeader>
      <PageContent className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-10 w-full max-w-xl" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}
