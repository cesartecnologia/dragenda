import { PageContainer, PageContent, PageHeader, PageHeaderContent } from '@/components/ui/page-container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedLoading() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <Skeleton className="h-8 w-48" />
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}
