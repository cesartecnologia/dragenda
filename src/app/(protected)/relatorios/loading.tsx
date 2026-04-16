import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageContainer, PageContent, PageHeader, PageHeaderContent } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingRelatoriosPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <Skeleton className="h-8 w-40" />
        </PageHeaderContent>
      </PageHeader>
      <PageContent className="space-y-4">
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-32" /></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}
