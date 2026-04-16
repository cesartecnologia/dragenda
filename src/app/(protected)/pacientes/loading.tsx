import { Card, CardContent } from '@/components/ui/card';
import { PageContainer, PageContent, PageHeader, PageHeaderContent } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingPacientesPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <Skeleton className="h-8 w-36" />
        </PageHeaderContent>
      </PageHeader>
      <PageContent className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}
